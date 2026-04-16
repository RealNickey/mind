(Get-Content lib/auto-categorize.ts) -replace 'generateEmbedding', 'generateLocalEmbedding' | Set-Content lib/auto-categorize.ts
