import requests


def main():
    print("Hello from uv-one!")
    response = requests.get("https://api.github.com")
    print(f"GitHub API status code: {response.status_code}")


if __name__ == "__main__":
    main()
