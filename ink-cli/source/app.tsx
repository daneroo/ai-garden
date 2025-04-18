import React, { useEffect, useState } from "react";
import { Box, Text, Static } from "ink";
import Spinner from "ink-spinner";

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
	subtasks?: TaskResultItem[];
}

// Sample task structure - in a real app, this might come from a config file
const generateTasks = (count: number, subtasksCount: number = 4): Task[] => {
	const tasks: Task[] = [];
	for (let i = 1; i <= count; i++) {
		const subtasks: Subtask[] = [];
		for (let j = 1; j <= subtasksCount; j++) {
			subtasks.push({ id: `task-${i}-${j}`, name: `Subtask ${i}.${j}` });
		}
		tasks.push({
			id: `task-${i}`,
			name: `Task ${i}`,
			subtasks,
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

export default function App() {
	const [tasks] = useState<Task[]>(() => generateTasks(6, 2));
	const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);
	const [currentSubtaskIndex, setCurrentSubtaskIndex] = useState<number>(0);
	const [completedTasks, setCompletedTasks] = useState<TaskResultItem[]>([]);
	const [progress, setProgress] = useState<number>(0);
	const [isComplete, setIsComplete] = useState<boolean>(false);

	useEffect(() => {
		const runTasks = async () => {
			for (let i = 0; i < tasks.length; i++) {
				const task = tasks[i]!;
				setCurrentTaskIndex(i);

				let taskSuccess = true;
				const taskSubtasks: TaskResultItem[] = [];

				// Process subtasks
				for (let j = 0; j < task.subtasks.length; j++) {
					const subtask = task.subtasks[j]!;
					setCurrentSubtaskIndex(j);

					// Execute subtask
					const subtaskSuccess = await executeTask();

					// Only record failed subtasks
					if (!subtaskSuccess) {
						taskSubtasks.push({
							task: subtask,
							status: "failure",
						});
						taskSuccess = false;
					}
				}

				// Record all tasks, with their status and any failed subtasks
				setCompletedTasks((prev) => [
					...prev,
					{
						task,
						status: taskSuccess ? "success" : "failure",
						subtasks: taskSubtasks,
					} as TaskResultItem,
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

	if (!currentTask) {
		return <Text>Loading...</Text>;
	}

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text>Progress: {Math.round(progress * 100)}%</Text>
			</Box>

			{/* Show current task and its subtasks */}
			{currentTask && (
				<Box flexDirection="column">
					<Box>
						<Text color="blue">
							<Spinner type="dots" />
						</Text>
						<Text> {currentTask.name}</Text>
					</Box>
					{currentTask.subtasks.map((subtask, index) => {
						const isCompleted = index < currentSubtaskIndex;
						const isCurrent = index === currentSubtaskIndex;
						return (
							<Box key={subtask.id} marginLeft={2}>
								{isCompleted ? (
									<TaskResult task={subtask} status="success" />
								) : isCurrent ? (
									<Box>
										<Text color="cyan">
											<Spinner type="dots" />
										</Text>
										<Text> {subtask.name}</Text>
									</Box>
								) : (
									<Text color="gray">- {subtask.name}</Text>
								)}
							</Box>
						);
					})}
				</Box>
			)}

			<Box marginTop={1}>
				<Text>Completed:</Text>
			</Box>

			<Static items={completedTasks}>
				{(item) => {
					const failedSubtasks = item.subtasks?.filter(subtask => subtask.status === "failure") || [];

					return (
						<Box key={item.task.id} flexDirection="column">
							<TaskResult task={item.task} status={item.status} />
							{failedSubtasks.map((subtask) => (
								<Box key={subtask.task.id} marginLeft={2}>
									<TaskResult task={subtask.task} status={subtask.status} />
								</Box>
							))}
						</Box>
					);
				}}
			</Static>
		</Box>
	);
}
