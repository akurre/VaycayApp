# Smart City Distribution Plan

## Problem Statement

After implementing Phase 1 (global coverage with 1 city per country + top 300 by population), we've identified two issues:

1. **Country Imbalance**: Large countries like China and India dominate the map with too many cities
2. **Missing Cities**: Some countries (e.g., Australia) aren't showing up despite having data
3. **Need for Zoom Support**: Users should see more detail when zooming into specific regions

## Current State Analysis

### What We Know
- **Total cities**: ~26,527 cities across ~150 countries
- **Current limit**: 300 cities globally
- **Current strategy**: 1 per country + top 300 by population
- **Problem**: Top 300 by population heavily favors China, India, USA, Indonesia, Brazil

### Why Australia Might Be Missing
- Australia's most populous city may not have weather data for the queried date
- Or the raw SQL query isn't finding it due to data issues
- Need to investigate: Does Australia have data in the database?

## Proposed Solution: Adaptive Country Quotas

### Core Concept: Fair Distribution with Smart Limits

Instead of a simple "top 300 cities," we'll use an **adaptive quota system** that:
1. Ensures every country gets representation
2. Limits how many cities any single country can show
3. Adapts based on the number of countries with data
4. Works seamlessly with zoom-based loading (Phase 2)

### Algorithm: Three-Tier Selection

#### Tier 1: Country Representatives (Guaranteed)
```
For each country with data:
  - Select 1 most populous city
  - This ensures global coverage
```

#### Tier 2: Adaptive Country Quotas
```
