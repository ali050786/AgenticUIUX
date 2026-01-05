import os
import fnmatch

def parse_gitignore(gitignore_path):
    """
    Parses a .gitignore file and returns a list of patterns to ignore.
    """
    ignore_patterns = []
    if os.path.exists(gitignore_path):
        with open(gitignore_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    ignore_patterns.append(line)
    return ignore_patterns

def should_ignore(path, base_path, ignore_patterns):
    """
    Checks if a file or directory path should be ignored based on patterns.
    """
    rel_path = os.path.relpath(path, base_path)
    filename = os.path.basename(path)
    
    # Always ignore .git directory, sys files, and the script itself/output
    if filename == '.git':
        return True
    if filename == 'collect_code.py':
        return True
    if filename == 'collected_code.md':
        return True
    if filename == '.DS_Store':
        return True
        
    for pattern in ignore_patterns:
        # Normalizing pattern related stuff
        clean_pattern = pattern.rstrip('/')
        
        # Match against filename (e.g. *.pyc)
        if fnmatch.fnmatch(filename, clean_pattern):
            return True
            
        # Match against relative path (e.g. node_modules/)
        if fnmatch.fnmatch(rel_path, clean_pattern):
            return True

        # Handle patterns that might start with / or not
        if pattern.startswith('/'):
            # rooted pattern
            if fnmatch.fnmatch(rel_path, pattern[1:]):
                return True
        else:
            # loose pattern, can match anywhere
            if fnmatch.fnmatch(rel_path, clean_pattern) or \
               fnmatch.fnmatch(rel_path, f"**/{clean_pattern}"):
                 return True
                 
    return False

def get_language_from_extension(filename):
    """
    Returns the markdown language tag based on file extension.
    """
    ext = os.path.splitext(filename)[1].lower()
    mapping = {
        '.py': 'python',
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.html': 'html',
        '.css': 'css',
        '.json': 'json',
        '.md': 'markdown',
        '.sh': 'bash',
        '.yml': 'yaml',
        '.yaml': 'yaml',
        '.sql': 'sql',
        '.gitignore': 'text',
        '.dockerignore': 'text',
        'Dockerfile': 'dockerfile',
    }
    return mapping.get(ext, '')

def generate_tree(base_path, ignore_patterns):
    """
    Generates a string representation of the directory tree.
    """
    tree_str = []
    
    def _add_to_tree(dir_path, prefix=''):
        files = []
        dirs = []
        
        try:
            items = os.listdir(dir_path)
            items.sort()
            
            for item in items:
                path = os.path.join(dir_path, item)
                if not should_ignore(path, base_path, ignore_patterns):
                    if os.path.isdir(path):
                        dirs.append(item)
                    else:
                        files.append(item)
                        
            entries = dirs + files
            count = len(entries)
            
            for index, entry in enumerate(entries):
                is_last = (index == count - 1)
                connector = '└── ' if is_last else '├── '
                
                tree_str.append(f"{prefix}{connector}{entry}")
                
                new_prefix = prefix + ('    ' if is_last else '│   ')
                
                full_path = os.path.join(dir_path, entry)
                if os.path.isdir(full_path):
                    _add_to_tree(full_path, new_prefix)
                    
        except PermissionError:
            pass

    tree_str.append(".")
    _add_to_tree(base_path)
    return "\n".join(tree_str)

def collect_code(base_path, output_file):
    """
    Traverses the directory, collects code, and writes to the output file.
    """
    gitignore_path = os.path.join(base_path, '.gitignore')
    ignore_patterns = parse_gitignore(gitignore_path)
    
    # Add robust defaults
    default_ignores = ['.git', '__pycache__', 'node_modules', 'venv', '.env', '.DS_Store', 'dist', 'build', '.next', '.idea', '.vscode', 'package-lock.json', 'tsconfig.tsbuildinfo', 'favicon.ico' ]
    ignore_patterns.extend(default_ignores)

    with open(output_file, 'w', encoding='utf-8') as outfile:
        # Title and Tree Structure
        outfile.write(f"# Project: UIUX Codebase\n\n")
        
        outfile.write("## Project Structure\n")
        outfile.write("```text\n")
        outfile.write(generate_tree(base_path, ignore_patterns))
        outfile.write("\n```\n\n")
        
        outfile.write("---\n\n")
        
        # File Contents
        for root, dirs, files in os.walk(base_path):
            dirs[:] = [d for d in dirs if not should_ignore(os.path.join(root, d), base_path, ignore_patterns)]
            dirs.sort() # Ensure deterministic order
            files.sort()
            
            for file in files:
                file_path = os.path.join(root, file)
                
                if should_ignore(file_path, base_path, ignore_patterns):
                    continue
                
                rel_path = os.path.relpath(file_path, base_path)
                
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as infile:
                        content = infile.read()
                        
                        outfile.write(f"## File: {rel_path}\n")
                        language = get_language_from_extension(file)
                        outfile.write(f"```{language}\n")
                        outfile.write(content)
                        if not content.endswith('\n'):
                            outfile.write('\n')
                        outfile.write("```\n\n")
                        print(f"Collected: {rel_path}")
                        
                except Exception as e:
                    print(f"Error reading {rel_path}: {e}")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_filename = os.path.join(script_dir, 'collected_code.md')
    
    print(f"Scanning directory: {script_dir}")
    collect_code(script_dir, output_filename)
    print(f"Done! All code collected in {output_filename}")
