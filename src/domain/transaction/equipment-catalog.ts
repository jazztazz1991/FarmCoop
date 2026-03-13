export interface EquipmentItem {
  id: string;
  name: string;
  xmlPath: string;
  category: string;
}

// Paths confirmed from FS25 store item dump in game log
export const EQUIPMENT_CATALOG: EquipmentItem[] = [
  {
    id: "fendt-vario-200",
    name: "Fendt Vario 200",
    xmlPath: "data/vehicles/fendt/vario200/vario200.xml",
    category: "Tractors",
  },
  {
    id: "fendt-vario-300",
    name: "Fendt Vario 300",
    xmlPath: "data/vehicles/fendt/vario300/vario300.xml",
    category: "Tractors",
  },
  {
    id: "fendt-vario-500",
    name: "Fendt Vario 500",
    xmlPath: "data/vehicles/fendt/vario500/vario500.xml",
    category: "Tractors",
  },
  {
    id: "johndeere-3650",
    name: "John Deere 3650",
    xmlPath: "data/vehicles/johnDeere/series3650/series3650.xml",
    category: "Tractors",
  },
  {
    id: "caseih-farmall120c",
    name: "Case IH Farmall 120C",
    xmlPath: "data/vehicles/caseIH/farmall120C/farmall120C.xml",
    category: "Tractors",
  },
  {
    id: "claas-arion550",
    name: "Claas Arion 550",
    xmlPath: "data/vehicles/claas/arion550/arion550.xml",
    category: "Tractors",
  },
  {
    id: "masseyferguson-5700s",
    name: "Massey Ferguson 5700 S",
    xmlPath: "data/vehicles/masseyFerguson/series5700S/series5700S.xml",
    category: "Tractors",
  },
];
