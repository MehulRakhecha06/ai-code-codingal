import colorama
from colorama import Fore,Style
from textblob import TextBlob
import time
import sys

colorama.init(autoreset=True)

def show_processing_animation():
    loading_messages = "analyzing sentiment"
    for i in range(3):
        for char in "|/-\\":
            sys.stdout.write(f"\r{loading_messages}{char}")
            sys.stdout.flush()
            time.sleep(0.4)
#didnt understand

def analyze_sentiment(text):
    blob=TextBlob(text)
    sentiment_score=blob.sentiment.polarity
    if sentiment_score>0:
        return "positive"
    elif sentiment_score<0:
        return "negative"
    else:
        return "neutral"
    

history = []
positive_count = 0
negative_count = 0
neutral_count = 0

def execute_command(command):
    global positive_count,negative_count,neutral_count,history

    if command == "summary":
        return f"\n positive: {positive_count}\n negative:{negative_count}\n neutral: {neutral_count}"
    elif command == "reset":
        positive_count=negative_count=neutral_count=0
        history.clear()
        return "all data has been reset"
    elif command == "history":
        if not history:
            return "no history avaiable"
        return "\n".join([f"User: {entry['user_input']} | Sentiment: {entry['sentiment']}" for entry in history])
    elif command == "help":
        return(
            " - summary: view sentiment summary\n"
            " - reset: Reset all data\n"
            " - history: View conversation history\n"
            " - help: List available commands\n"
            " - exit: End the chat"
        )
    else:
        return "Invalid command."
    
def get_valid_name():
    name=input("please enter your name")

def chatbot():
    global positive_count, negative_count, neutral_count, history
    
    print("Welcome to the Sentiment Analysis Chatbot!")
    
    name = get_valid_name()
    print(f"Hello, {name}! I'm here to analyze your text sentiment.")
    print("Type any sentence to analyze its sentiment, or type 'exit' to end the conversation.")
    print("For help, type 'help'.")
    
    while True:
        user_input = input(f"{name}: ")

        if user_input.lower() == "exit":
            print("Ending the chat...")
            print(generate_final_report())
            break
        
        if user_input.lower() == "help":
            print(execute_command("help"))
            continue
        
        elif user_input.lower() == "summary":
            print(execute_command("summary"))
            continue
        
        elif user_input.lower() == "reset":
            print(execute_command("reset"))
            continue
        
        elif user_input.lower() == "history":
            print(execute_command("history"))
            continue
        
        show_processing_animation()  
        sentiment = analyze_sentiment(user_input)
        
        history.append({'user_input': user_input, 'sentiment': sentiment})
        if sentiment == "positive":
            positive_count += 1
        elif sentiment == "negative":
            negative_count += 1
        else:
            neutral_count += 1
        
        if sentiment == "positive":
            print(f"{Fore.GREEN}Sentiment: {sentiment} - Great! Keep it up!")
        elif sentiment == "negative":
            print( f"{Fore.RED}Sentiment: {sentiment} - Oh no! Something's wrong.")
        else:
            print( f"{Fore.YELLOW}Sentiment: {sentiment} - Hmm... it's neutral.")
            
def generate_final_report():
    return f"Final Report: Positive: {positive_count}, Negative: {negative_count}, Neutral: {neutral_count}"

if __name__ == "__main__":
    chatbot()
