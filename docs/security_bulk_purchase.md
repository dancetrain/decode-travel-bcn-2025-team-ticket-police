# Security for BulkPurchase

## The Problem
The business sells tickets online for various activities. 
Those activities are very popular in the city, and a few opportunistic individuals purchase tickets in advance with the intention of reselling them later.
The business suffers damage to its reputation and incurs financial losses.

## The Solution
To prevent such activities automatically - we could use external rate-limiter.
We could attach event listener to TicketMint event and can enforce custom rules that detect violations.
But this is not a perfect solution - better to create TicketReselling mechanism which is covered in the next chapter