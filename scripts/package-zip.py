import os
import time
import zipfile

EXCLUDE_DIRS = {'node_modules', '.git', 'dist', '.aistudio', '__pycache__', '.vite'}
EXCLUDE_FILES = {'bun.lock', '.DS_Store', 'vtv-dienstagskick.zip', 'test-download.zip'}

def create_windows_compatible_zip(output_path):
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Remove existing zip if present
    if os.path.exists(output_path):
        os.remove(output_path)
    
    added_dirs = set()

    with zipfile.ZipFile(output_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
        for root, dirs, files in os.walk(root_dir):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
            dirs.sort()
            files.sort()

            # Add directory entries first (CRITICAL for Windows Explorer compatibility)
            rel_root = os.path.relpath(root, root_dir).replace('\\', '/')
            if rel_root != '.':
                dir_entry = rel_root + '/'
                if dir_entry not in added_dirs:
                    added_dirs.add(dir_entry)
                    mtime = time.localtime(os.path.getmtime(root))[:6]
                    zinfo = zipfile.ZipInfo(dir_entry, mtime)
                    # 0x10 = Windows DIRECTORY attribute; 0o755 = Unix dir permissions
                    zinfo.external_attr = 0x10 | (0o755 << 16)
                    zinfo.flag_bits |= 0x800  # UTF-8 encoded filename
                    zipf.writestr(zinfo, b'')

            for file in files:
                if file in EXCLUDE_FILES or file.endswith('.zip') or file.startswith('.'):
                    # Keep .gitignore and .env.example
                    if file not in {'.gitignore', '.env.example'}:
                        continue

                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, root_dir).replace('\\', '/')
                
                # Ensure all parent directories exist in the zip
                parts = rel_path.split('/')[:-1]
                cum_dir = ""
                for part in parts:
                    cum_dir = f"{cum_dir}{part}/"
                    if cum_dir not in added_dirs:
                        added_dirs.add(cum_dir)
                        dir_mtime = time.localtime()[:6]
                        zinfo = zipfile.ZipInfo(cum_dir, dir_mtime)
                        zinfo.external_attr = 0x10 | (0o755 << 16)
                        zinfo.flag_bits |= 0x800
                        zipf.writestr(zinfo, b'')

                with open(file_path, 'rb') as f:
                    content = f.read()

                mtime = time.localtime(os.path.getmtime(file_path))[:6]
                zinfo = zipfile.ZipInfo(rel_path, mtime)
                # 0x20 = Windows ARCHIVE attribute; 0o644 = Unix file permissions
                zinfo.external_attr = 0x20 | (0o644 << 16)
                zinfo.flag_bits |= 0x800  # UTF-8 filename flag
                zinfo.compress_type = zipfile.ZIP_DEFLATED
                zipf.writestr(zinfo, content)

    print(f"ZIP created successfully at {output_path} ({os.path.getsize(output_path)} bytes)")

if __name__ == '__main__':
    public_zip = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'vtv-dienstagskick.zip'))
    create_windows_compatible_zip(public_zip)
