"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_COMMUNITY_RULES = void 0;
// Default configuration
exports.DEFAULT_COMMUNITY_RULES = {
    point_system: {
        rules: [
            "Points are awarded for valuable contributions",
            "Larger tasks receive more points",
            "Technical contributions are highly valued"
        ],
        badge_types: ["helper", "builder", "teacher", "innovator"],
        monetary_rewards: false
    },
    existing_badges: ["helper", "builder", "teacher", "innovator"],
    reward_guidelines: {
        min_points: 10,
        max_points: 500
    }
};
