import os
import zipfile

EXCLUDE_DIRS = {'node_modules', '.git', 'dist', '.aistudio', '__pycache__'}
EXCLUDE_FILES = {'bun.lock', '.DS_Store', 'vtv-dienstagskick.zip'}

def create_zip(output_path):
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(root_dir):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for file in files:
                if file in EXCLUDE_FILES:
                    continue
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, root_dir)
                zipf.write(file_path, rel_path)
    print(f"ZIP created at {output_path}")

if __name__ == '__main__':
    public_zip = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'vtv-dienstagskick.zip'))
    create_zip(public_zip)
