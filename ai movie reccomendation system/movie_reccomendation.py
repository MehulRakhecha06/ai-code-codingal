import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from textblob import Textblob
from colorama import init,Fore
import time
import  sys

init(autoreset=True)

def load_data(file_path = 'imdb_top_1000.csv'):
    try:
        df= pd.read_csv(file_path)
        df['combined_features'] = df['genre'].fillna('')+''+df['overview'].fillna('')
        return df
    except FileNotFoundError:
        print(Fore.RED +f"Error:the file'{file_path}'was not found")
        exit()
movies_df = load_data()

tfidf = TfidfVectorizer(stop_words = 'english')
tfidf_matrix = tfidf.fit_transform(movies_df['combined_features'])
cosine_sim = cosine_similarity(tfidf_matrix,tfidf_matrix)



def list_genres(df):
    return sorted(set(genre.strip() for sublist in df['genre'].dropna().str.split(',') for genre in sublist))

genres = list_genres(movies_df)

def recommend_movies(genre=None,mood=None,rating=None,top_n=5):
    filtered_df = movies_df
    if genre:
        filtered_df= filtered_df[filtered_df['Genre'].str.contains(genre,case=False,na=False)]
    if rating:
        filtered_df= filtered_df[filtered_df['IMDB_rating']>=rating]

    filtered_df= filtered_df.sample(frac=1).reset_index(drop=True)
    recommndations = []
    for idx,row in filtered_df.iterrows():
        overview = row['Overview']
        if pd.isna(overview):
            continue
        polarity = Textblob(overview).sentiment.polarity
        if(mood and ((Textblob(mood).sentiment.polarity<0 and polarity >0) or polarity >= 0)) or not mood:
            recommndations.append((row['series_title'],polarity))
        if len(recommndations) == top_n:
            break
    return recommndations if recommndations else "no sutiable movie recommendations found"

def display_recommendation(recs,name):
    print(Fore.YELLOW + f"\nAI-Analyzed Movie Recommendations for {name}:")
    for idx,(title,polarity)in enumerate(recs,1):
        sentiment = "Positive" if polarity >0 else "Negative" if polarity <0 else "Neutral"
        print(f"{Fore.CYAN}{idx}, {title} (Polarity: {polarity: .2f},{sentiment})")
def processing_animation():
    for _ in range(3):
        print(Fore.YELLOW + ".", end="",flush=True) 
        time.sleep(0.5)

def handle_ai(name):
    print(Fore.BLUE + "\n Lets find the perfect movie for you!")
    print(Fore.GREEN + "Available genres ",end="")
    for idx,genre in enumerate(genres,1):
        print(f"{Fore.YELLOW}{idx}.{genre}",end="")
    print("\n")

    while True:
        genre_input = input(Fore.YELLOW + "enter genre number or name").strip()
        if genre_input.isdigit() and 1<= int(genre_input) <= len(genres):
            genre = genres[int(genre_input)-1]
            break
        elif genre_input in genres:
            genre = genre_input.title()
            break
        print(Fore.RED + "invalid genre.Please try again")
    mood= input(Fore.YELLOW + "enter your mood(positive/negative/neutral) or leave blank:").strip()
