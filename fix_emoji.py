import sys

path = r"e:\GOO\frontend\src\pages\LeaderboardPage.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

star = "\u2b50"
pin = "\U0001f4cd"

before = len(content)
content = content.replace(
    '{leader.name} {leader.isUser && "' + star + '"}',
    '{leader.name} {leader.isUser && <Star size={14} color="#d4af37" fill="#d4af37" />}'
)
content = content.replace(
    pin + " {leader.location",
    '<MapPin size={11} /> {leader.location'
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

after = len(content)
print(f"Done. Bytes changed: {before} -> {after}")
