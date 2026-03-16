
import os
import re

def find_missing_imports(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.jsx', '.js')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Find all JSX components (e.g., <Sparkles ... /> or <Sparkles />)
                components = set(re.findall(r'<([A-Z][a-zA-Z0-9]*)[\s/>]', content))
                
                # Find all imported names
                imports = set(re.findall(r'import\s+.*?\{([\s\S]*?)\}\s+from', content))
                imported_names = set()
                for imp in imports:
                    # Split by comma and clean up whitespace and 'as' aliases
                    names = [n.split(' as ')[-1].strip() for n in imp.split(',')]
                    imported_names.update(names)
                
                # Also find default imports
                default_imports = set(re.findall(r'import\s+([A-Z][a-zA-Z0-9]*)\s+from', content))
                imported_names.update(default_imports)

                # Filter components that are common HTML tags or defined in the same file
                # This is a bit rough but it helps
                defined_components = set(re.findall(r'const\s+([A-Z][a-zA-Z0-9]*)\s*=', content))
                imported_names.update(defined_components)

                missing = components - imported_names
                
                # Ignore some common false positives
                missing = {m for m in missing if m not in ['Fragment', 'AnimatePresence', 'Panel', 'Handle', 'Position', 'Controls', 'Background', 'MiniMap', 'ReactFlow', 'ReactFlowProvider', 'Link', 'NodeResizer', 'MarkerType']}

                if missing:
                    print(f"File: {path}")
                    print(f"  Potentially missing imports: {missing}")

if __name__ == "__main__":
    find_missing_imports('c:\\Users\\ashis.TUFA17\\Downloads\\horizons-export-56c6f051-ea3b-4ab0-a99e-9bb8ba28c0c5\\src')
