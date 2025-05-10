import colorama
from colorama import Fore,Style
from textblob import TextBlob

colorama.init(autoreset=True)

print(f"{Fore.CYAN} Welcome to sentement spy")
user_name = input(f"{Fore.MAGENTA}please enter your name:")
if not user_name:
    user_name = "MYstery Agent"

conversation_history = []

print(f"\n{Fore.CYAN}Hello, Agent {user_name}")
print(f"I will analyze your sentences with textblob and show you your sentiment")
print(
    f"type{Fore.YELLOW}'reset'{Fore.CYAN},{Fore.YELLOW}'history'{Fore.CYAN},"
    f"or{Fore.YELLOW}'exit'{Fore.CYAN} to quit.\n"
    )

while True:
    user_input= input(f"{Fore.GREEN}>>").strip()

    if not user_input:
        print(f"{Fore.RED}Please enter some text or valid command")
    if user_input.lower()=="exit":
        print(f"{Fore.BLUE}Exiteing sentiment spy. Agent{user_name}")
        break
    elif user_input.lower()=="reset":
         conversation_history.clear()
         print(f"\n{Fore.CYAN}All conversation histories are clear")
         continue
    elif user_input.lower()=="history":
        if not conversation_history:
            print(f"{Fore.YELLOW} no conversation history yet")
        else:
            print(f"{Fore.CYAN}conversation history:")    