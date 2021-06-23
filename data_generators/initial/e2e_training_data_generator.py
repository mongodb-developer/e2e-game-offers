# importing the necessary libraries. Install sklearn, pandas and numpy first if you don't already have them

from sklearn.datasets import make_classification
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler


# In[ ]:


'''
Creating the dataset - a dataframe as "X" with all the data. "y" is the outcome field as an array

Argument explanations:
n_samples - rows
n_features - number of fields/columns in the dataset
n_informative - the number of fields that have a predictive relatinship with the outcome
n_redundant - the number of fields that have a high level of colinearity or interrelationship with each other
n_classes - the number of possible outcomes, or unique values in "y"
n_clusters_per_class - the number of cohorts, or groups, within each possible outcome - used for clustering in feature engineering
flip_y - the amount of random noise inserted into the dataset - .1 means 10% of the data is random noise
'''

X, y = make_classification(n_samples=10000000, n_features=15, n_informative=14, n_redundant=0, n_classes=5, n_clusters_per_class=4, flip_y=0.1)
print(X.shape, y.shape)


# In[ ]:


# Bringing the outcome field "y" into the dataframe and printing the result

df = pd.DataFrame(np.c_[X, y])
df


# In[ ]:


# creating a list of field names and then mapping them to the dataframe

my_columns = ["characterId", "historicalSpend", "nextRankIsRedStar", "shardsToNextRank", "totalEquipShardsLast7D", "totalEquipsLast7D", "totalPlayTimeLast7D", "weekDayOfPurchase", "grade", "level", "gear_tier", "shards", "stars", "redstars", "abilities", "offerId"]
df.columns = my_columns


# In[ ]:


# df.describe gives us some descriptive statistics of the dataframe now with the new fieldnames to review

df.describe()


# In[ ]:


'''
Here is the structure of the data that will be generated in our app and sent to our model for inference

{
    "offerId":                      {"$choose": {"from": [1,2,3,4,5]}},
    "characterId":                  {"$integer":{"min":1, "max":12}},
    "historicalSpend":              {"$integer":{"min":0, "max":200000}},
    "nextRankIsRedStar":            "$bool",
    "shardsToNextRank":             {"$integer":{"min":30, "max":50}},
    "totalEquipShardsLast7D":       {"$integer":{"min":50, "max":150}},
    "totalEquipsLast7D":            {"$integer":{"min":70, "max":150}},
    "totalPlayTimeLast7D":          {"$integer":{"min":1,  "max":2000}},
    "weekDayOfPurchase":            {"$integer":{"min":1, "max":7}},
    "grade":                        {"$choose":{"from": ["A","B","C","D"]}},
    "level":                        {"$integer":{"min":1, "max":80}},
    "gear_tier":                    {"$integer":{"min":1, "max":15}},
    "shards":                       {"$integer":{"min":1, "max":810}},
    "stars":                        {"$integer":{"min":1, "max":6}},
    "redstars":                     {"$integer":{"min":1, "max":7}},
    "abilities":                    {"$integer":{"min":0, "max":26}}
}
'''


# In[ ]:


# creating a dictionary to catalog the range of values for each field - referring to the cell above

thisdict = {
  "offerId": (1,5),
  "characterId": (1,12),
  "historicalSpend": (0,200000),
    "nextRankIsRedStar": (0,1),
    "shardsToNextRank": (30,50),
    "totalEquipShardsLast7D": (50,150),
    "totalEquipsLast7D": (70,150),
    "totalPlayTimeLast7D": (1,2000),
    "weekDayOfPurchase": (1,7),
    "grade": (1,4),
    "level": (1,80),
    "gear_tier": (1,15),
    "shards": (1,810),
    "stars": (1,6),
    "redstars": (1,7),
    "abilities": (0,26)
}


# In[ ]:


# rescaling our data in every field from it's current range to the range assigned in our dictionary

for eachitem in thisdict:
    scaler = MinMaxScaler(feature_range=thisdict[eachitem])
    df[[eachitem]] = scaler.fit_transform(df[[eachitem]])


# In[ ]:


# getting rid of the decimal values - rounding them to the nearest integer

df = df.round(0)


# In[ ]:


# changing the datatypes of our fields from decimal to integer

df = df.apply(pd.to_numeric, downcast='integer')


# In[ ]:


# printing the dataframe to make sure everything looks correct

df


# In[ ]:


# CHANGE THE PATH AND CSV FILE NAME TO WHATEVER YOU WANT - below is just an example.
# If you don't keep index=False you'll have an extra field in your csv for it

df.to_csv('/Users/andrew.chaffin/Downloads/trainingData.csv', index=False)
