
import os
import subprocess

def verify():
    # It's better to run main.py in a separate process
    # to ensure the logging configuration is picked up correctly.
    try:
        # Using python directly from the venv
        python_executable = os.path.join(".venv", "Scripts", "python.exe")
        if not os.path.exists(python_executable):
            print(f"Error: Python executable not found at {python_executable}")
            return

        result = subprocess.run([python_executable, "main.py"], 
                                capture_output=True, text=True, timeout=30)
        
        print("--- main.py stdout ---")
        print(result.stdout)
        print("--- main.py stderr ---")
        print(result.stderr)

    except FileNotFoundError:
        print("Error: 'python' command not found. Make sure Python is in your PATH.")
        return
    except subprocess.TimeoutExpired:
        print("Error: main.py took too long to execute.")
        return
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return

    log_file = "shift_activities.log"
    if os.path.exists(log_file):
        print(f"
✅ Success: '{log_file}' created.")
        with open(log_file, "r") as f:
            content = f.read()
            print(f"
--- Content of {log_file} ---")
            print(content)
            if "Sending sale" in content:
                print("✅ Verification successful: Log content seems correct.")
            else:
                print(f"⚠️ Verification warning: Log content might be incomplete or incorrect.")
    else:
        print(f"
❌ Failure: '{log_file}' was not created.")

if __name__ == "__main__":
    verify()
