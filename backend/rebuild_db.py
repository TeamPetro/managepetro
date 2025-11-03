import subprocess
import time
import sys

def run(cmd: str):
    print(f"> {cmd}")
    result = subprocess.run(cmd, shell=True)
    if result.returncode != 0:
        sys.exit(result.returncode)

def main():
    print("Rebuilding Manage Petro database...")
    run("docker compose down -v")
    run("docker compose up -d")

    print("Waiting for MySQL to initialize...")
    time.sleep(15)

    run("docker exec -i manage-petro-mysql mysql -ump_app -pdevpass manage_petro < ./db/seed.sql")

    print("Database rebuild complete.")

if __name__ == "__main__":
    main()

