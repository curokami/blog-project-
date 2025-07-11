import os
from datetime import datetime

def create_blog_post():
    print("新しいブログ記事を作成します。")

    title = input("記事のタイトルを入力してください: ")
    author = "suihan"
    description = input("記事の概要を入力してください: ")

    pub_date = datetime.now().strftime("%Y-%m-%d")

    image_filename = input("画像ファイル名を入力してください (例: your-image.jpg, オプション): ")
    image = f"/images/{image_filename}" if image_filename else ""
    tags_input = input("タグをカンマ区切りで入力してください (例: tech, programming, オプション): ")
    tags = [tag.strip() for tag in tags_input.split(',')] if tags_input else []

    draft_input = input("下書きとして保存しますか？ (yes/no, オプション, デフォルト: no): ").lower()
    draft = draft_input == 'yes'

    # ファイル名の生成
    # タイトルをスネークケースに変換し、日本語を削除
    slug = "".join(c if c.isalnum() else "-" for c in title).strip("-").lower()
    # 連続するハイフンを一つにまとめる
    slug = "-".join(filter(None, slug.split("-")))

    file_name = f"{datetime.now().strftime('%Y-%m-%d')}-{slug}.md"
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, "..", "src", "content", "posts", file_name)

    front_matter_lines = [
        "---",
        f"title: \"{title}\"",
        f"pubDate: {pub_date}",
        f"author: \"{author}\"",
        f"description: \"{description}\""
    ]

    if image:
        front_matter_lines.append(f"image: \"{image}\"")
    if tags:
        front_matter_lines.append(f"tags: {tags}")
    if draft:
        front_matter_lines.append(f"draft: {draft}")

    front_matter_lines.append("---")
    front_matter_lines.append("") # Empty line after front matter
    front_matter_lines.append(f"# {title}")
    front_matter_lines.append("") # Empty line after title
    front_matter_lines.append("記事の内容をここに記述してください。")

    front_matter = "\n".join(front_matter_lines)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(front_matter)

    print(f"記事が正常に作成されました: {file_path}")

if __name__ == "__main__":
    create_blog_post()
