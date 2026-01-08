import { default as wcmatch } from "wildcard-match";

export const isMatch = (path: string, pattern: string): boolean => {
  if (pattern === "*") return true;
  if (pattern.startsWith("!")) {
    return !wcmatch(pattern.slice(1))(path);
  }
  return wcmatch(pattern)(path);
};

// 按照模式长度排序，优先匹配更具体的模式
export const findMatching = (
  path: string,
  patterns: string[],
): string | null => {
  const sortedPatterns = [...patterns].sort((a, b) => b.length - a.length);
  for (const pattern of sortedPatterns) {
    if (isMatch(path, pattern)) return pattern;
  }
  return null;
};
