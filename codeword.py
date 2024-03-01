
d = 2
h = 4

codewords = [[4,0,0,0,0],[3,1,0,0,0],[2,2,0,0,0],[1,3,0,0,0],[0,4,0,0,0],[0,3,1,0,0],[1,2,1,0,0],[2,1,1,0,0],[3,0,1,0,0],[2,0,2,0,0],[1,1,2,0,0],[0,2,2,0,0],[0,1,3,0,0],[1,0,3,0,0],[1,0,2,1,0],[0,1,2,1,0],[0,2,1,1,0],[1,1,1,1,0],[2,0,1,1,0],[3,0,0,1,0],[2,1,0,1,0],[1,2,0,1,0],[0,3,0,1,0],[0,2,0,2,0],[1,1,0,2,0],[2,0,0,2,0],[1,0,1,2,0],[0,1,1,2,0],[0,1,1,1,1],[1,0,1,1,1],[2,0,0,1,1],[1,1,0,1,1],[0,2,0,1,1],[0,3,0,0,1],[1,2,0,0,1],[2,1,0,0,1],[3,0,0,0,1],[2,0,1,0,1],[1,1,1,0,1],[0,2,1,0,1],[0,1,2,0,1],[1,0,2,0,1]]
# codewords = [[3,0,0,0],[2,1,0,0],[1,2,0,0],[0,3,0,0],[0,2,1,0],[1,1,1,0],[2,0,1,0],[1,0,2,0],[0,1,2,0],[0,1,1,1],[1,0,1,1],[2,0,0,1],[1,1,0,1],[0,2,0,1]]
N = len(codewords[0])
all_rev_codes = []
for code in codewords:
    rev_code = code[::-1]
    all_rev_codes.append(rev_code[0:N]) 
print('Reversed Codes: ',all_rev_codes)

def stack(codewords,d,h):
    valid_codewords = []
    N = len(codewords[0])
    for code in codewords:
        valid_code = True
        if code[0] != (d + h - 2) - sum(code[1:d+1]):
            valid_code = False
        # first condition
        for i in range(1, d):
            if code[i] > (d + h - 1) - i - sum(code[i+1:d+1]): 
                valid_code = False
        if valid_code:
            valid_codewords.append(code)
    return valid_codewords 

stack_words = stack(codewords,d,h)
print() 
print('stack length:',len(stack_words))

rev_codes = []
short_codes = []
for code in stack_words:
    rev_code = code[::-1]
    short_codes.append(list(reversed(rev_code))[1:d+1])
    rev_codes.append(list(reversed(rev_code)))

print("d =", d)
print("Height =", h)
for i in range(len(short_codes)):
    print(f'stack_code: {short_codes[i]} code_word: {rev_codes[i]}')
print(rev_codes)
print(short_codes)