import SoccerStand from "../models/soccerStand.js";

export const seedInitSoccerStands = async () => {
  try {
    const count = await SoccerStand.count();
    if (count === 0) {
      await SoccerStand.bulkCreate([
        {
          name: "Occidental",
          total_capacity: 80,
          description: "Tribuna principal con asientos cubiertos y vista privilegiada del campo. Incluye palcos VIP y zona de prensa.",
        },
        {
          name: "Oriental",
          total_capacity: 90,
          description: "Tribuna lateral con excelente visibilidad. Cuenta con servicios de cafetería y baños modernos.",
        },
        {
          name: "Norte",
          total_capacity: 55,
          description: "Tribuna popular sin techo, ideal para la hinchada local. Ambiente festivo y cercano al campo.",
        },
        {
          name: "Sur",
          total_capacity: 55,
          description: "Tribuna destinada a visitantes con acceso independiente y medidas de seguridad reforzadas.",
        },
      ]);

      console.log("Tribunas creadas");
    } else {
      console.log("Omitiendo seed de tribunas");
    }
  } catch (error) {
    console.error("Error al inicializar las tribunas:", error);
  }
};