export const DAILY_PROTOCOL = {
    // Workouts (0=Sun, 1=Mon, ..., 6=Sat)
    workouts: {
        1: { type: "PULL", focus: "Deadlift & Back", moves: ["Heavy Deadlifts (90kg+)", "Wide Grip Pull-ups", "DB Rows", "Barbell Curls"] },
        2: { type: "PUSH", focus: "Bench & Dips", moves: ["Bench Press", "Weighted Dips", "Diamond Push-ups", "Lateral Raises"] },
        3: { type: "LEGS & SKILLS", focus: "Squat & Core", moves: ["Barbell Squats", "Walking Lunges", "Hanging Leg Raises", "L-Sit Practice"] },
        4: { type: "PULL", focus: "Deadlift & Back", moves: ["Heavy Deadlifts (90kg+)", "Wide Grip Pull-ups", "DB Rows", "Barbell Curls"] },
        5: { type: "PUSH", focus: "Bench & Dips", moves: ["Bench Press", "Weighted Dips", "Diamond Push-ups", "Lateral Raises"] },
        6: { type: "LEGS & SKILLS", focus: "Squat & Core", moves: ["Barbell Squats", "Walking Lunges", "Hanging Leg Raises", "L-Sit Practice"] },
        0: { type: "REST", focus: "Recovery & Mobility", moves: ["Foam Rolling", "Stretching", "Light Walk"] }
    },

    // Finishers pool
    finishers: [
        "50 Burpees (Time Cap: 5 mins)",
        "2 Minute Max Plank",
        "100 Push-ups (As fast as possible)",
        "Tabata Sprints (4 mins)",
        "Death by Lunges (Walking lunge until failure)"
    ],

    // Nutrition (Standardized Daily Plan for 2300cal / 120g Protein)
    nutrition: {
        breakfast: {
            name: "Post-Gym Power Breakfast",
            items: ["4 Whole Eggs", "1 Slice Toast / Multigrain Bread"],
            protein: 26,
            macros: "High Fat/Protein"
        },
        lunch: {
            name: "Growth & Fuel Lunch",
            items: ["150g Chicken Breast / Fish", "1 Bowl Dal", "1 Roti", "Green Salad"],
            protein: 40,
            macros: "Balanced Carbs/Protein"
        },
        snack: {
            name: "Evening Protein Spike",
            items: ["50g Roasted Soya Chunks OR 100g Paneer"],
            protein: 25,
            macros: "Pure Protein"
        },
        dinner: {
            name: "Shred Mode Dinner",
            items: ["150g Chicken Keema / Stir-fry", "Double Veggies", "NO Carbs (No Rice/Roti)"],
            protein: 30,
            macros: "High Protein / Zero Carb"
        }
    }
};
