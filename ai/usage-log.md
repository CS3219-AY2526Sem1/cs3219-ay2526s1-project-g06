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



# Date/Time:
2025‑11‑12

# Tool:
ChatGPT-5

# File Affected:
history/index.js

# Prompt/Command:
Generate a schema for the questions
Help with debugging
Generate boilerplate for server setup

# Output Summary:
Generated schema and helped with debugging
Generated boilerplate for server setup

# Action Taken:
-Modified

# Author Notes:
I validated correctness, edited for style



# Date/Time:
2025‑11‑12

# Tool:
ChatGPT-5

# File Affected:
QuestionHistory.tsx

# Prompt/Command:
Generate type for question history
Add typing to each function
Help with debugging
Generate boilerplate for fetch calls

# Output Summary:
Generated a type
Added typing to each function
Helped with debugging
Generated boilerplate for fetch calls

# Action Taken:
-Modified

# Author Notes:
I validated correctness, edited for style



# Date/Time:
2025-10-18

# Tool:
Claude Code (Claude Sonnet 4.5)

# Prompt/Command:
Fix Firebase JSON encoding in deployment - getting corrupted during SSH transmission

# Output Summary:
Suggested base64 encoding Firebase JSON before SSH transfer

# Action Taken:
-Modified

# Author Notes:
Implemented base64 approach, tested deployment, verified Firebase auth works



# Date/Time:
2025-10-19

# Tool:
Claude Code (Claude Sonnet 4.5)

# Prompt/Command:
FIREBASE_B64 variable undefined in SSH session

# Output Summary:
Identified variable scoping issue, suggested passing directly

# Action Taken:
-Modified

# Author Notes:
Removed base64 logic, simplified to direct JSON passing, tested deployment



# Date/Time:
2025-10-19

# Tool:
Claude Code (Claude Sonnet 4.5)

# Prompt/Command:
Add migration for missing profileCompleted field on existing users

# Output Summary:
Generated migration check during login to set default values

# Action Taken:
-Accepted as-is

# Author Notes:
Validated migration runs once per user, tested with existing accounts



# Date/Time:
2025-10-19

# Tool:
Claude Code (Claude Sonnet 4.5)

# Prompt/Command:
Firebase JSON losing quotes when written to .env file

# Output Summary:
Suggested heredoc instead of echo to preserve formatting

# Action Taken:
-Accepted as-is

# Author Notes:
Validated heredoc preserves JSON, tested deployment



# Date/Time:
2025-10-19

# Tool:
Claude Code (Claude Sonnet 4.5)

# Prompt/Command:
Session cookies not sent from CloudFront frontend to EC2 backend

# Output Summary:
Explained SameSite='lax' blocks cross-site, suggested SameSite='none'

# Action Taken:
-Modified

# Author Notes:
Applied to all cookie operations, researched security implications, tested cross-site behavior



# Date/Time:
2025-10-19

# Tool:
Claude Code (Claude Sonnet 4.5)

# Prompt/Command:
GitHub Actions YAML parsing error with nested heredoc

# Output Summary:
Suggested reverting to sequential echo commands

# Action Taken:
-Accepted as-is

# Author Notes:
Validated YAML syntax, tested workflow



# Date/Time:
2025-10-19

# Tool:
Claude Code (Claude Sonnet 4.5)

# Prompt/Command:
FIREBASE_JSON empty in SSH session

# Output Summary:
Explained variable passing to SSH, suggested quoted heredoc

# Action Taken:
-Accepted as-is

# Author Notes:
Tested variable expansion in SSH context



# Date/Time:
2025-10-19

# Tool:
Claude Code (Claude Sonnet 4.5)

# Prompt/Command:
Variables not expanding in heredoc

# Output Summary:
Explained quoted vs unquoted heredoc, suggested \$ escape syntax

# Action Taken:
-Accepted as-is

# Author Notes:
Researched heredoc behavior, tested in local and SSH contexts



# Date/Time:
2025-10-19

# Tool:
Claude Code (Claude Sonnet 4.5)

# Prompt/Command:
Cookies not sent with follow-up requests after login

# Output Summary:
Suggested adding explicit path: '/' to all cookies

# Action Taken:
-Accepted as-is

# Author Notes:
Applied to all cookie operations, tested persistence



# Date/Time:
2025-10-19

# Tool:
Claude Code (Claude Sonnet 4.5)

# Prompt/Command:
Environment variables empty in deployed .env file

# Output Summary:
Suggested SCP for Firebase JSON, improved secret handling

# Action Taken:
-Modified

# Author Notes:
Added debug output, ensured cleanup of temp files, tested end-to-end



# Date/Time:
2025-10-19

# Tool:
Claude Code (Claude Sonnet 4.5)

# Prompt/Command:
GitHub Actions YAML validation failing on heredoc

# Output Summary:
Suggested echo commands instead of cat heredoc

# Action Taken:
-Accepted as-is

# Author Notes:
Validated YAML compliance, tested workflow
