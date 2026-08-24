import { resolve, TOKENS } from "@core/di/container";
import { eventBus } from "@core/events/EventBus";
import type { MedicineRepository } from "@core/repositories";
import type { PharmacyService } from "../domain";

export const pharmacyService: PharmacyService = {
  async createMedicine(data) {
    const medicine = { id: crypto.randomUUID(), ...data, createdAt: new Date(), updatedAt: new Date() } as any;
    eventBus.emit("MedicineCreated", { medicineId: medicine.id, name: data.name, category: data.category });
    return medicine;
  },

  async updateMedicine(medicineId, data) {
    return { id: medicineId, ...data } as any;
  },

  async deleteMedicine(medicineId) {
    return;
  },

  async getMedicineById(medicineId) {
    const repo = resolve<MedicineRepository>(TOKENS.MedicineRepository);
    return (await repo.findById(medicineId)) as any;
  },

  async getMedicinesByCategory(category, params) {
    const repo = resolve<MedicineRepository>(TOKENS.MedicineRepository);
    return (await repo.findByCategory(category, params)) as any;
  },

  async searchMedicines(query, params) {
    const repo = resolve<MedicineRepository>(TOKENS.MedicineRepository);
    return (await repo.search(query, params)) as any;
  },

  async getRequiresPrescription(params) {
    const repo = resolve<MedicineRepository>(TOKENS.MedicineRepository);
    return (await repo.findRequiresPrescription(params)) as any;
  },

  async updateStock(medicineId, quantityChange) {
    const repo = resolve<MedicineRepository>(TOKENS.MedicineRepository);
    const medicine = (await repo.findById(medicineId)) as any;
    if (!medicine) throw new Error("Medicine not found");
    const newQuantity = medicine.stock_quantity + quantityChange;
    const result = await repo.update(medicineId, { stock_quantity: newQuantity });
    eventBus.emit("MedicineStockChanged", { medicineId, previousQuantity: medicine.stock_quantity, newQuantity });
    return result as any;
  },
};
