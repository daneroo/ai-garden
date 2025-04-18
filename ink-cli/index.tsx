import React, { useEffect, useState } from "react";
import { render, Box, Text, Static } from "ink";
import Spinner from "ink-spinner";
// import ProgressBar from "ink-progress-bar";

// Define types for our task structure
interface Subtask {
  id: string;
  name: string;
}

interface Task {
  id: string;
  name: string;
  subtasks: Subtask[];
}

interface TaskResultItem {
  task: Task | Subtask;
  status: "success" | "failure";
}

// Sample task structure - in a real app, this might come from a config file
const generateTasks = (count: number): Task[] => {
  const tasks: Task[] = [];
  for (let i = 1; i <= count; i++) {
    tasks.push({
      id: `task-${i}`,
      name: `Task ${i}`,
      subtasks: [
        { id: `task-${i}-1`, name: `Subtask ${i}.1` },
        { id: `task-${i}-2`, name: `Subtask ${i}.2` },
      ],
    });
  }
  return tasks;
};

// Helper for simulating task execution
const executeTask = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const willSucceed = Math.random() > 0.2; // 80% chance of success
    setTimeout(() => {
      resolve(willSucceed);
    }, 1000);
  });
};

interface TaskResultProps {
  task: Task | Subtask;
  status: "success" | "failure";
}

const TaskResult: React.FC<TaskResultProps> = ({ task, status }) => {
  const color = status === "success" ? "green" : "red";
  const symbol = status === "success" ? "✓" : "✗";

  return (
    <Box>
      <Text color={color}>{symbol} </Text>
      <Text>{task.name}</Text>
    </Box>
  );
};

interface TaskProgressProps {
  task: Task;
  subtask?: Subtask;
}

const TaskProgress: React.FC<TaskProgressProps> = ({ task, subtask }) => {
  return (
    <Box flexDirection="column">
      <Box>
        <Text color="blue">
          <Spinner type="dots" />
        </Text>
        <Text> {task.name}</Text>
      </Box>
      {subtask && (
        <Box marginLeft={2}>
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
          <Text> {subtask.name}</Text>
        </Box>
      )}
    </Box>
  );
};

const App: React.FC = () => {
  const [tasks] = useState<Task[]>(generateTasks(100));
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);
  const [currentSubtaskIndex, setCurrentSubtaskIndex] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<TaskResultItem[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  useEffect(() => {
    const runTasks = async () => {
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        setCurrentTaskIndex(i);

        let taskSuccess = true;

        // Process subtasks
        for (let j = 0; j < task.subtasks.length; j++) {
          const subtask = task.subtasks[j];
          setCurrentSubtaskIndex(j);

          // Execute subtask
          const subtaskSuccess = await executeTask();

          // Record subtask result
          setCompletedTasks((prev) => [
            ...prev,
            {
              task: subtask,
              status: subtaskSuccess ? "success" : "failure",
            },
          ]);

          if (!subtaskSuccess) {
            taskSuccess = false;
          }
        }

        // Record task result
        setCompletedTasks((prev) => [
          ...prev,
          {
            task,
            status: taskSuccess ? "success" : "failure",
          },
        ]);

        // Update progress
        setProgress((i + 1) / tasks.length);
      }

      setIsComplete(true);
    };

    runTasks();
  }, [tasks]);

  // If there are no tasks, we're done
  if (tasks.length === 0) {
    return <Text>No tasks to process</Text>;
  }

  // If we're done, show a summary
  if (isComplete) {
    const successCount = completedTasks.filter(
      (t) => t.status === "success"
    ).length;
    const totalCount = completedTasks.length;

    return (
      <Box flexDirection="column">
        <Text>All tasks completed!</Text>
        <Text>
          Success rate: {successCount}/{totalCount} (
          {Math.round((successCount / totalCount) * 100)}%)
        </Text>
      </Box>
    );
  }

  const currentTask = tasks[currentTaskIndex];
  const currentSubtask = currentTask?.subtasks[currentSubtaskIndex];

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text>Progress: </Text>
        {/* <ProgressBar percent={progress} /> */}
        <Text> {Math.round(progress * 100)}%</Text>
      </Box>

      <TaskProgress task={currentTask} subtask={currentSubtask} />

      <Box marginTop={1}>
        <Text>Completed:</Text>
      </Box>

      <Static items={completedTasks}>
        {(item, index) => (
          <TaskResult key={index} task={item.task} status={item.status} />
        )}
      </Static>
    </Box>
  );
};

async function main() {
  render(<App />);
}

main().catch(console.error);
