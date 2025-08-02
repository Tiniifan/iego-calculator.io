# Inazuma Eleven GO Value Calculator
An advanced calculator to determine special move power in Inazuma Eleven GO, based on IEGO Deluxe 0.2.3 data.

**Note: This tool is currently only available in French.**

## Features

### Player Management
- **Player selection**: Search and select from a comprehensive player database
- **Detailed information**: Display of player name, position, and element
- **Customizable statistics**: Manual modification of all statistics

### Special move System
- **Complete database**: Access to all special move from IEGO Deluxe with their characteristics
- **Flexible configuration**: Ability to modify element and base power of special moves
- **Partner management**: Selection of number of partners (1 to 3) and number with the same element

### Saved Builds
- **Configuration saving**: System for saving player builds
- **Build management**: Adding and removing custom builds

### Advanced Calculations
- **Final power**: Precise calculation of minimum, constant, and maximum power
- **Probabilities**: Display of chances to obtain each power level
- **Critical system**: Calculation of critical chances and multipliers
- **Special effects**: Consideration of calls and other modifiers

## Calculation Formulas

### Base Power Calculation
Base power is calculated using the formula:
```
= -0.00030000001 * (player_power²) + 0.53100002 * player_power + 0.4693 + technique_power
```
Where `power` is determined by:
```
player_power = primaryStat * 0.8 + technique * 0.2
```
The primary statistic depends on the technique category:
- **Shoot**: Kick
- **Block**: Defense
- **Dribble**: Control
- **Save**: Catch

### Elemental Modifiers
Elemental bonuses/penalties are applied according to these rules:
- **Same element**: +5 bonus
- **Counter element**: -5 penalty
- **"Power Elements" talent**: +10 additional if same element
- **"Element Boost"**: +10 if technique element matches
- **"No element" talent**: Cancels all elemental modifiers
- **Element Call**: +20 if call element matches technique

### Other skills
- **"Big moves!" or "Give It Your All!"**: ×1.2 to final power
- **"Put Your Back Into It!"**: ×1.5 to critical chances
- **"Critical!"**: ×0.3 to critical chances but ×4 to multiplier

### Group Multipliers
Modifiers related to partners:
- **2 partners**: ×1.25 to base power
- **3 partners**: ×1.5 to base power
- **Same element partners**: +5 (2 total) or +10 (3 total)

### Technique Calculation
Base technique follows this formula:
```
basePrecision = -0.00050000002 * (technique²) + 0.1122 * technique + 0.88779998 + 20
```
With modifiers based on number of partners:
- **1 partner**: ×1.0
- **2 partners**: ×0.9
- **3 partners**: ×0.8

### Result Probabilities
The system calculates probabilities over 52 possible outcomes:
- **Min Power**: 80% of final power
- **Constant Power**: 100% of final power
- **Max Power**: 120% of final power

## Special thanks
I would like to thank the **IEGO Deluxe dev team** for their exceptional work on the database and game mechanics that made this calculator possible.
