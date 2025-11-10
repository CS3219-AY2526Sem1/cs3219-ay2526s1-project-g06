# AI Usage Log Template
# Date/Time:
 2025‑10‑13

# Tool:
Cursor utilising Claude Sonnet 4.5

# File Affected:
updateRouter.ts

# Prompt/Command:
How to to run validtors from mongooese on a findAndUpdate operation and return the new document inserted instead of the old one

# Output Summary:
Was suggested to use {new: true, runValidators: true} in the query, which did what was expected

# Action Taken:
-Modified

# Author Notes:
This approach given was correct and confirmed to be after reading mongodb documentation. It was mdoified as it merely suggest that subsection, 
which was used as part of a larger query.  



# Date/Time:
 2025‑10‑13

# Tool:
Cursor utilising Claude Sonnet 4.5

# File Affected:
readRouter.ts

# Prompt/Command:
How to generate 1 random document from mongodb database 

# Output Summary:
The ai suggested an approach of using aggregate in conjunction with sample size of 1 

# Action Taken:
-Modified

# Author Notes:
This approach was used in several functions require a random document. It was modified as the ai merely suggested a viable approach it did not generate code. 
Later this approach was verified to be the accepeted way to do such an operation based on online sources such as stackoverflow. Despite the official 
mongodb docuemntation not stating how it was done. 



# Date/Time:
2025‑11‑10

# Tool:
Cursor utilising Claude Sonnet 4.5

# File Affected:
API_DOCUMENTATION.md (specifically question service api)

# Prompt/Command:
Read through my question service under services/question service. I have 4 sub routers, each route has a description above it which explains what it does. Using this information generate api documentation for the question service in markdown format. 

# Output Summary:
The AI generated api documentation based on the description of my endpoint comments for question service, which was written above every endpoint. 

# Action Taken:
-Modified

# Author Notes:
The output was mostly correct, however removed headers which had admin as not yet implmeneted. 



# Date/Time:
2025‑11‑10

# Tool:
Cursor utilising Claude Sonnet 4.5

# File Affected:
readRouter.ts

# Prompt/Command:
Generate a trivial helper function to sort difficulty by easy, medium an hard using inbuilt sort. 

# Output Summary:
The AI generated a helper function to sort difficulty but was not entirely correct as it needed typescript types. 

# Action Taken:
-Modified

# Author Notes:
Added typescript types to the sortDifficulty function and it works as intended.