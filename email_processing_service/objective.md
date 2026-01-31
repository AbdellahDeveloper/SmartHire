API ENDPOINTS:
- Retreive All New Candidates CVs
    - INPUT: NONE
    - PROCESS: 
        - Go through all subscribers(POP3/IMAP Credentials), for each subscriber, get all pdf attachements from new emails.
        - For each pdf, check that it's a CV then create the candidate.
            - Use candidate service.
    - OUTPUT: Success Message