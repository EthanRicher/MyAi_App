export const parseMedicationAI = (response) => {
  try {
    const medsPart = response.split("MEDICATIONS:")[1];
    if (!medsPart) return [];

    const start = medsPart.indexOf("[");
    const end = medsPart.lastIndexOf("]") + 1;

    const json = medsPart.substring(start, end);

    return JSON.parse(json);
  } catch (e) {
    return [];
  }
};