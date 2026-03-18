import os
import sys

print("Python version:", sys.version)
print("System path:", sys.path)
print("----------------")

files_to_check = []
for root, dirs, files in os.walk("app"):
    for file in files:
        if file.endswith(".py"):
            files_to_check.append(os.path.join(root, file))

broken_files = []
for file_path in files_to_check:
    module_path = file_path.replace(os.sep, ".").replace(".py", "")
    try:
        # We try to import each module
        __import__(module_path)
    except Exception as e:
        broken_files.append((file_path, str(e)))

if broken_files:
    print("Found broken imports:")
    for file, err in broken_files:
        print(f"File: {file} | Error: {err}")
else:
    print("All modules imported successfully!")
