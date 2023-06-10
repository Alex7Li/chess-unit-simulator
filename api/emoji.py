with open('api/emoji.txt', 'r') as f:
    emoji = [e.rstrip('\n') for e in f.readlines()]
# print(''.join(emoji)) # All visible in terminal
# print(len(emoji)) # 506
