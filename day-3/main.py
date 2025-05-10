import re,random
from colorama import Fore , init
init(autoreset=True)

destinations = {
    "beaches":["bali","maldives","phuket"],
    "mountains":["swiss alps","rocky mountains","himalayas"],
    }

jokes =[

]

def normalize_input(text):
    return re.sub(r"\s+","",text.strip().lower())
def recommend():
    print(Fore.CYAN +"travel bot:beaches,mountains or cities")
    preference = input(Fore.YELLOW + "you:")
    preference = normalize_input(preference)

    if preference in destinations:
        suggestion = random.choice{destinations(preference)}
        print(Fore.GREEN + "travel bot :how about (suggestions)?")
        print(Fore.CYAN +"travel bot : do you like it?(yes/no)")
        answer=input(Fore.YELLOW +"you:").lower()

    
        if answer == "yes":
            