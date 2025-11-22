import json
import os
import sys
import tempfile
import traceback

import numpy as np
import pandas as pd
import xarray as xr
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename


# Custom JSON encoder to handle numpy types and other serialization issues
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, bytes):
            return obj.decode('utf-8', errors='replace')
        elif pd.isna(obj):
            return None
        return super(NumpyEncoder, self).default(obj)

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
ALLOWED_EXTENSIONS = {'nc'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def clean_and_bin_netcdf(file_path, save_path=None, bin_size=10, debug=True):
    """
    Updated single file processor with enhanced error handling and metadata extraction
    """
    try:
        # --- Load NetCDF file ---
        ds = xr.open_dataset(file_path, decode_cf=True, mask_and_scale=True)
        
        # --- Convert to pandas DataFrame ---
        df = ds.to_dataframe().reset_index()
        df.columns = [c.lower() for c in df.columns]
        
        if debug: 
            print(f"Loaded: {df.shape}")
        
        # Store original columns for metadata
        original_columns = df.columns.tolist()
        
        # --- Handle scientific calibration fields ---
        sci_cols = [c for c in df.columns if c.startswith("scientific_calib")]
        if sci_cols:
            # Convert bytes → str if needed
            for c in sci_cols:
                if df[c].dtype == object:
                    df[c] = df[c].apply(
                        lambda x: x.decode() if isinstance(x, (bytes, bytearray)) else x
                    )

            # Check comments for "bad"
            if "scientific_calib_comment" in df.columns:
                bad_mask = df["scientific_calib_comment"].str.contains(
                    "bad", case=False, na=False
                )
                if bad_mask.mean() < 0.8:  # not mostly bad
                    df = df[~bad_mask]

            # Check calibration QC flags
            if "scientific_calib_qc" in df.columns:
                qcs = df["scientific_calib_qc"].astype(str)
                if (qcs == "3").mean() < 0.8:
                    df = df[qcs.astype(int) < 3]

            # Drop all calibration columns afterwards
            df = df.drop(columns=sci_cols, errors="ignore")

        if debug: 
            print(f"After calib filter: {df.shape}")

        # --- Drop obvious junk columns ---
        drop_cols = [c for c in df.columns if c.startswith(
            ("history", "n_", "data_type", "format_version", "crs")
        )]
        df = df.drop(columns=drop_cols, errors="ignore")
        if debug: 
            print(f"After dropping junk cols: {df.shape}")

        # --- Remove duplicate rows ---
        df = df.drop_duplicates()
        if debug: 
            print(f"After duplicates: {df.shape}")

        # --- Drop empty rows (all three vars missing) ---
        essential_cols = ["pres", "temp", "psal"]
        available_essential = [col for col in essential_cols if col in df.columns]
        
        if available_essential:
            df = df.dropna(subset=available_essential, how="all")
        
        if debug: 
            print(f"After dropna essential cols: {df.shape}")
        
        if df.empty:
            return pd.DataFrame(), {"error": "No data remaining after cleaning"}

        # --- QC logic for pres, temp, psal ---
        for var in available_essential:
            qc_col = f"{var}_qc"
            adj_col = f"{var}_adjusted"
            adj_qc_col = f"{var}_adjusted_qc"

            if qc_col in df.columns and adj_col in df.columns and adj_qc_col in df.columns:
                def choose_value(row):
                    qc_val = str(row[qc_col]).replace("b'", "").replace("'", "").strip()
                    adj_qc_val = str(row[adj_qc_col]).replace("b'", "").replace("'", "").strip()
                    try:
                        qc_val = int(qc_val[0]) if qc_val else 9
                    except:
                        qc_val = 9
                    try:
                        adj_qc_val = int(adj_qc_val[0]) if adj_qc_val else 9
                    except:
                        adj_qc_val = 9

                    if pd.isna(row[adj_col]):
                        return row[var]
                    if adj_qc_val < qc_val:
                        return row[adj_col]
                    return row[var]

                df[var] = df.apply(choose_value, axis=1)

            df = df.drop(columns=[qc_col, adj_col, adj_qc_col], errors="ignore")

        if debug: 
            print(f"After QC logic: {df.shape}")

        # --- Profile-wide QC handling ---
        for var in available_essential:
            qc_col = f"{var}_qc"
            if qc_col in df.columns:
                qcs = df[qc_col].astype(str)
                if (qcs == "3").mean() < 0.8:  # not mostly bad
                    df = df[qcs.astype(int) < 3]
                df = df.drop(columns=[qc_col], errors="ignore")

        if debug: 
            print(f"After profile-wide QC: {df.shape}")

        # --- Drop rows with no remaining data ---
        if available_essential:
            df = df.dropna(subset=available_essential, how="all")
        
        if debug: 
            print(f"Final data before binning: {df.shape}")
        
        if df.empty:
            return pd.DataFrame(), {"error": "No data remaining after QC"}

        # --- Compute statistics and metadata ---
        meta_cols = ["platform_number", "cycle_number", "direction",
                     "date_creation", "platform_type", "juld",
                     "latitude", "longitude", "data_mode"]
        
        # Calculate statistics only for core oceanographic parameters
        core_params = ['pres', 'temp', 'psal']
        statistics = {}
        
        for col in core_params:
            if col in df.columns and not df[col].isna().all():
                statistics[col] = {
                    'mean': float(df[col].mean()) if not pd.isna(df[col].mean()) else None,
                    'std': float(df[col].std()) if not pd.isna(df[col].std()) else None,
                    'min': float(df[col].min()) if not pd.isna(df[col].min()) else None,
                    'max': float(df[col].max()) if not pd.isna(df[col].max()) else None,
                    'count': int(df[col].count())
                }

        # Convert any remaining bytes objects to strings in the DataFrame
        for col in df.columns:
            if df[col].dtype == 'object':
                df[col] = df[col].apply(lambda x: x.decode('utf-8') if isinstance(x, bytes) else str(x) if x is not None else None)

        # --- Compute mean row from raw/unbinned data ---
        mean_row = {}
        for col in available_essential:
            if col in df.columns and not df[col].isna().all():
                mean_row[col] = df[col].mean()
        
        for col in meta_cols:
            if col in df.columns and len(df) > 0:
                mean_row[col] = df.iloc[0][col]
        mean_row["profile_id"] = "Mean"
        
        # --- Bin by pressure (matching original logic) ---
        if "pres" in df.columns and not df["pres"].isna().all():
            # Create pressure bins
            df["pres_bin"] = (df["pres"] // bin_size) * bin_size
            
            # Group by pressure bin and calculate means
            binned_groups = df.groupby("pres_bin", as_index=False)
            
            # Create aggregation dictionary for available columns
            agg_dict = {}
            for col in available_essential:
                if col in df.columns:
                    agg_dict[col] = "mean"
            
            # Perform binning
            binned = binned_groups.agg(agg_dict)
            
            # Add metadata columns to each binned row
            for col in meta_cols:
                if col in df.columns and len(df) > 0:
                    binned[col] = df.iloc[0][col]
            binned["profile_id"] = "Binned"
            
            # Combine binned data with mean row
            mean_df = pd.DataFrame([mean_row])
            final_df = pd.concat([binned, mean_df], ignore_index=True)
            
            if debug:
                print(f"Binning results: {len(binned)} bins + 1 mean row = {len(final_df)} total rows")
        else:
            # If no pressure data, just add the mean row to the original data
            df_copy = df.copy()
            df_copy["profile_id"] = "Original"
            mean_df = pd.DataFrame([mean_row])
            final_df = pd.concat([df_copy, mean_df], ignore_index=True)

        # --- Keep lean schema ---
        keep_cols = meta_cols + available_essential + ["profile_id"]
        final_df = final_df[[c for c in keep_cols if c in final_df.columns]]

        # Save if path provided
        if save_path:
            final_df.to_csv(save_path, index=False)

        # Prepare metadata with more detailed information
        metadata = {
            "original_shape": df.shape,
            "final_shape": final_df.shape,
            "original_columns": original_columns,
            "final_columns": final_df.columns.tolist(),
            "statistics": statistics,
            "processing_info": {
                "bin_size": bin_size,
                "available_essential_cols": available_essential,
                "has_pressure_data": "pres" in df.columns and not df["pres"].isna().all(),
                "unique_pressure_bins": len(df.groupby("pres_bin")) if "pres_bin" in df.columns else 0,
                "data_rows_before_binning": len(df),
                "data_rows_after_binning": len(final_df)
            }
        }

        if debug:
            print(f"Processing summary:")
            print(f"  Original data: {df.shape[0]} rows, {df.shape[1]} columns")
            print(f"  Final data: {final_df.shape[0]} rows, {final_df.shape[1]} columns")
            print(f"  Available essential columns: {available_essential}")
            if "pres_bin" in df.columns:
                print(f"  Pressure range: {df['pres'].min():.2f} to {df['pres'].max():.2f}")
                print(f"  Number of pressure bins: {len(df.groupby('pres_bin'))}")
                print(f"  Bin size: {bin_size}")
            print(f"  Core parameter statistics: {list(statistics.keys())}")

        return final_df, metadata

    except Exception as e:
        error_msg = f"Processing error: {str(e)}"
        if debug:
            error_msg += f"\nTraceback: {traceback.format_exc()}"
        return pd.DataFrame(), {"error": error_msg}

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only .nc files allowed'}), 400
        
        # Secure filename and save
        filename = secure_filename(file.filename)
        timestamp = str(int(pd.Timestamp.now().timestamp()))
        unique_filename = f"{timestamp}_{filename}"
        
        input_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        output_path = os.path.join(PROCESSED_FOLDER, f"{unique_filename.replace('.nc', '.csv')}")
        
        file.save(input_path)
        
        # Process the file with debug=True to see what's happening
        bin_size = request.form.get('bin_size', 10, type=int)
        result_df, metadata = clean_and_bin_netcdf(input_path, output_path, bin_size=bin_size, debug=True)
        
        if result_df.empty:
            error_response = {
                'error': metadata.get('error', 'Unknown processing error')
            }
            return app.response_class(
                response=json.dumps(error_response, cls=NumpyEncoder),
                status=400,
                mimetype='application/json'
            )
        
        # Convert DataFrame to JSON for preview - handle serialization issues
        preview_df = result_df.head(20).copy()
        
        # Convert any problematic data types for JSON serialization
        for col in preview_df.columns:
            if preview_df[col].dtype == 'object':
                preview_df[col] = preview_df[col].apply(lambda x: 
                    x.decode('utf-8') if isinstance(x, bytes) else 
                    str(x) if x is not None else None
                )
            elif pd.api.types.is_datetime64_any_dtype(preview_df[col]):
                preview_df[col] = preview_df[col].astype(str)
                
        preview_data = preview_df.to_dict('records')
        
        # Clean up uploaded file
        os.remove(input_path)
        
        response_data = {
            'success': True,
            'filename': unique_filename.replace('.nc', '.csv'),
            'preview_data': preview_data,
            'metadata': metadata,
            'download_url': f'/download/{os.path.basename(output_path)}',
            'debug_info': {
                'original_rows': metadata.get('original_shape', [0])[0] if metadata.get('original_shape') else 0,
                'final_rows': len(result_df),
                'processing_steps': metadata.get('processing_info', {})
            }
        }
        
        # Use custom encoder to handle JSON serialization issues
        return app.response_class(
            response=json.dumps(response_data, cls=NumpyEncoder),
            status=200,
            mimetype='application/json'
        )
        
    except Exception as e:
        error_response = {
            'error': f'Server error: {str(e)}',
            'traceback': traceback.format_exc()
        }
        return app.response_class(
            response=json.dumps(error_response, cls=NumpyEncoder),
            status=500,
            mimetype='application/json'
        )

@app.route('/download/<filename>')
def download_file(filename):
    try:
        file_path = os.path.join(PROCESSED_FOLDER, filename)
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True)
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    print("NetCDF Processor Server Starting...")
    print(f"Upload folder: {os.path.abspath(UPLOAD_FOLDER)}")
    print(f"Processed folder: {os.path.abspath(PROCESSED_FOLDER)}")
    app.run(debug=True, port=5000)