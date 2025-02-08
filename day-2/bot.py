import tkinter as tk
from tkinter import scrolledtext, messagebox, simpledialog
import colorama
from colorama import Fore
from textblob import TextBlob

colorama.init(autoreset=True)

positive_count = 0
negative_count = 0
neutral_count = 0
history = []
user_name = ""  # Will store user's name

def get_user_name():
    """Ask user for their name when the app starts."""
    global user_name
    user_name = simpledialog.askstring("User Name", "Please enter your name:")
    if not user_name:  # If user cancels or enters nothing
        user_name = "mystry man"
    name_label.config(text=f"Hello, {user_name}!", font=("Arial", 14, "bold"))

def analyze_sentiment():
    """Analyze the sentiment of the entered text."""
    global positive_count, negative_count, neutral_count

    user_input = entry.get().strip()

    if not user_input:
        messagebox.showwarning("Warning", "Please enter some text!")
        return

    blob = TextBlob(user_input)
    sentiment_score = blob.sentiment.polarity

    if sentiment_score > 0:
        sentiment = "Positive"
        positive_count += 1
        sentiment_color = "green"
    elif sentiment_score < 0:
        sentiment = "Negative"
        negative_count += 1
        sentiment_color = "red"
    else:
        sentiment = "Neutral"
        neutral_count += 1
        sentiment_color = "blue"

    # Update history
    history.append(f"{user_name}: {user_input} | Sentiment: {sentiment}")
    update_history()

    # Show sentiment
    sentiment_label.config(text=f"Sentiment: {sentiment}", fg=sentiment_color)

def update_history():
    """Update the chat history in the text box."""
    history_text.config(state=tk.NORMAL)
    history_text.delete(1.0, tk.END)  # Clear previous history
    for entry in history:
        history_text.insert(tk.END, entry + "\n")
    history_text.config(state=tk.DISABLED)

def show_summary():
    """Show a summary of positive, negative, and neutral sentiments."""
    summary = f"Positive: {positive_count}\nNegative: {negative_count}\nNeutral: {neutral_count}"
    messagebox.showinfo("Summary", summary)

def reset():
    """Reset sentiment counters and history."""
    global positive_count, negative_count, neutral_count, history
    positive_count = negative_count = neutral_count = 0
    history.clear()
    history_text.config(state=tk.NORMAL)
    history_text.delete(1.0, tk.END)
    history_text.config(state=tk.DISABLED)
    sentiment_label.config(text="Sentiment: ", fg="black")
    messagebox.showinfo("Reset", "All data has been reset.")

# Create main window
root = tk.Tk()
root.title("Sentiment Analysis Chatbot")
root.geometry("500x550")

# UI Elements
name_label = tk.Label(root, text="Welcome!", font=("Arial", 14, "bold"))
name_label.pack(pady=5)

get_user_name()  # Ask for user's name at the start

tk.Label(root, text="Enter text to analyze:", font=("Arial", 12)).pack(pady=5)

entry = tk.Entry(root, width=50)
entry.pack(pady=5)

analyze_button = tk.Button(root, text="Analyze", command=analyze_sentiment, bg="lightblue", font=("Arial", 12))
analyze_button.pack(pady=5)

sentiment_label = tk.Label(root, text="Sentiment: ", font=("Arial", 12, "bold"))
sentiment_label.pack(pady=5)

summary_button = tk.Button(root, text="View Summary", command=show_summary, bg="lightgreen", font=("Arial", 12))
summary_button.pack(pady=5)

reset_button = tk.Button(root, text="Reset Data", command=reset, bg="red", font=("Arial", 12), fg="white")
reset_button.pack(pady=5)

tk.Label(root, text="History:", font=("Arial", 12)).pack(pady=5)
history_text = scrolledtext.ScrolledText(root, width=50, height=10, state=tk.DISABLED)
history_text.pack(pady=5)

root.mainloop()