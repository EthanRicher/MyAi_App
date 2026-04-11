import { runImagePipelineService } from "../../../services/pipelines/imagePipeline";

export const scanMedicationFromPhoto = async (image: string) => {
  const result = await runImagePipelineService(image, "Prescription_To_Log");

  if (result.error) {
    return { error: result.error };
  }

  if (!result.meds || result.meds.length === 0) {
    return { error: "No medication detected" };
  }

  const med = result.meds[0];

  return {
    name: med.name || "",
    dose: med.dosage || "",
    description: med.instructions || "",
  };
};