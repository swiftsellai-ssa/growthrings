'use client';

import React from 'react';

interface GoalType {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; 'aria-hidden'?: boolean }>;
  label: string;
  color: string;
  format: (val: number) => string;
}

interface GoalTypeSelectorProps {
  goalType: string;
  goalTypes: Record<string, GoalType>;
  onGoalTypeChange: (type: string) => void;
}

export const GoalTypeSelector: React.FC<GoalTypeSelectorProps> = ({
  goalType,
  goalTypes,
  onGoalTypeChange,
}) => {
  return (
    <fieldset className="mb-4">
      <legend className="block text-sm font-medium text-gray-700 mb-3">
        Growth Metric
      </legend>
      <div
        className="space-y-2"
        role="radiogroup"
        aria-label="Select your growth metric"
        aria-describedby="goal-type-description"
      >
        {Object.entries(goalTypes).map(([key, goal]) => (
          <button
            key={key}
            onClick={() => onGoalTypeChange(key)}
            className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              goalType === key
                ? `border-blue-500 bg-blue-50 text-blue-700`
                : 'border-gray-200 hover:border-gray-300'
            }`}
            role="radio"
            aria-checked={goalType === key}
            aria-labelledby={`goal-${key}-label`}
            aria-describedby={`goal-${key}-description`}
          >
            <goal.icon size={18} style={{ color: goal.color }} aria-hidden={true} />
            <span id={`goal-${key}-label`} className="font-medium">{goal.label}</span>
            <span id={`goal-${key}-description`} className="sr-only">
              Track your {goal.label.toLowerCase()} growth progress
            </span>
          </button>
        ))}
      </div>
      <p id="goal-type-description" className="sr-only">
        Choose which metric you want to track: followers, engagement rate, or monthly tweets
      </p>
    </fieldset>
  );
};