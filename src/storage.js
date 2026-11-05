export const emptyOperationsData = () => ({ robots: [], missions: [], alerts: [], commands: [] });

export async function loadAppData(userId) {
  const raw = localStorage.getItem(`aquaguardian-workspace-${userId}`);
  return raw ? JSON.parse(raw) : emptyOperationsData();
}

export async function saveAppData(userId, data) {
  localStorage.setItem(`aquaguardian-workspace-${userId}`, JSON.stringify(data));
}

export async function getAccount(userId) {
  const users = JSON.parse(localStorage.getItem("aquaguardian-users") || "[]");
  const user = users.find((item) => item.id === userId);
  if (!user) throw new Error("Account not found.");
  return user;
}
