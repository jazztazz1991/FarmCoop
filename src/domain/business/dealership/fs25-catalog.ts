export interface FS25Item {
  itemId: string;
  itemName: string;
  brand: string;
  /** In-game base price (in-game currency) — auto-fills the price field when selected */
  price?: number;
  type:
    | "tractor"
    | "harvester"
    | "forage_harvester"
    | "telehandler"
    | "truck"
    | "trailer"
    | "auger_wagon"
    | "plow"
    | "cultivator"
    | "disc_harrow"
    | "subsoiler"
    | "mulcher"
    | "seeder"
    | "sprayer"
    | "spreader"
    | "manure_spreader"
    | "slurry_tanker"
    | "mower"
    | "tedder"
    | "windrower"
    | "baler"
    | "grain_header"
    | "corn_header"
    | "commodity";
  category: "equipment" | "commodity";
}

export const FS25_CATALOG: FS25Item[] = [
  // ── Tractors ──────────────────────────────────────────────────────────────
  { itemId: "ANTONIO_CARRARO_MACH_4R", itemName: "Antonio Carraro Mach 4R", brand: "Antonio Carraro", type: "tractor", category: "equipment" },
  { itemId: "ANTONIO_CARRARO_TONY_10900_TTR", itemName: "Antonio Carraro Tony 10900 TTR", brand: "Antonio Carraro", type: "tractor", category: "equipment" },
  { itemId: "CASE_IH_FARMALL_C_105", itemName: "Case IH Farmall C 105", brand: "Case IH", price: 82000, type: "tractor", category: "equipment" },
  { itemId: "CASE_IH_VESTRUM_130", itemName: "Case IH Vestrum 130 CVXDrive", brand: "Case IH", price: 111500, type: "tractor", category: "equipment" },
  { itemId: "CASE_IH_PUMA_185", itemName: "Case IH Puma 185 CVX", brand: "Case IH", price: 239500, type: "tractor", category: "equipment" },
  { itemId: "CASE_IH_PUMA_240", itemName: "Case IH Puma 240 CVX", brand: "Case IH", price: 239500, type: "tractor", category: "equipment" },
  { itemId: "CASE_IH_MAGNUM_280", itemName: "Case IH Magnum 280 AFS Connect", brand: "Case IH", price: 351000, type: "tractor", category: "equipment" },
  { itemId: "CASE_IH_MAGNUM_380", itemName: "Case IH Magnum 380 CVX", brand: "Case IH", price: 351000, type: "tractor", category: "equipment" },
  { itemId: "CASE_IH_STEIGER_500", itemName: "Case IH Steiger 500 AFS Connect", brand: "Case IH", price: 685000, type: "tractor", category: "equipment" },
  { itemId: "CASE_IH_STEIGER_715_QUADTRAC", itemName: "Case IH Steiger 715 Quadtrac Black Edition", brand: "Case IH", price: 685000, type: "tractor", category: "equipment" },
  { itemId: "CLAAS_ARION_420", itemName: "CLAAS ARION 420", brand: "CLAAS", price: 91500, type: "tractor", category: "equipment" },
  { itemId: "CLAAS_ARION_460", itemName: "CLAAS ARION 460", brand: "CLAAS", price: 91500, type: "tractor", category: "equipment" },
  { itemId: "CLAAS_ARION_540", itemName: "CLAAS ARION 540", brand: "CLAAS", price: 153000, type: "tractor", category: "equipment" },
  { itemId: "CLAAS_ARION_570", itemName: "CLAAS ARION 570", brand: "CLAAS", price: 153000, type: "tractor", category: "equipment" },
  { itemId: "CLAAS_XERION_12_590", itemName: "CLAAS XERION 12.590", brand: "CLAAS", price: 565000, type: "tractor", category: "equipment" },
  { itemId: "CHALLENGER_MT665E", itemName: "Challenger MT665E", brand: "Challenger", type: "tractor", category: "equipment" },
  { itemId: "DEUTZ_FAHR_6C_RVSHIFT", itemName: "Deutz-Fahr 6C RVShift", brand: "Deutz-Fahr", price: 95000, type: "tractor", category: "equipment" },
  { itemId: "DEUTZ_FAHR_AGROSTAR_8_31", itemName: "Deutz-Fahr AgroStar 8.31", brand: "Deutz-Fahr", price: 89500, type: "tractor", category: "equipment" },
  { itemId: "DEUTZ_FAHR_6230_TTV", itemName: "Deutz-Fahr Series 6230 TTV", brand: "Deutz-Fahr", type: "tractor", category: "equipment" },
  { itemId: "DEUTZ_FAHR_7250_TTV_HD", itemName: "Deutz-Fahr Series 7250 TTV HD", brand: "Deutz-Fahr", price: 251500, type: "tractor", category: "equipment" },
  { itemId: "DEUTZ_FAHR_8280_TTV", itemName: "Deutz-Fahr Series 8280 TTV", brand: "Deutz-Fahr", price: 267000, type: "tractor", category: "equipment" },
  { itemId: "FENDT_211_V_VARIO", itemName: "Fendt 211 V Vario", brand: "Fendt", price: 91000, type: "tractor", category: "equipment" },
  { itemId: "FENDT_311_VARIO", itemName: "Fendt 311 Vario", brand: "Fendt", price: 134500, type: "tractor", category: "equipment" },
  { itemId: "FENDT_516_VARIO", itemName: "Fendt 516 Vario", brand: "Fendt", price: 152500, type: "tractor", category: "equipment" },
  { itemId: "FENDT_724_VARIO", itemName: "Fendt 724 Vario", brand: "Fendt", price: 249500, type: "tractor", category: "equipment" },
  { itemId: "FENDT_942_VARIO", itemName: "Fendt 942 Vario", brand: "Fendt", price: 327500, type: "tractor", category: "equipment" },
  { itemId: "FENDT_1050_VARIO", itemName: "Fendt 1050 Vario", brand: "Fendt", price: 382000, type: "tractor", category: "equipment" },
  { itemId: "FENDT_1107_MT", itemName: "Fendt 1107 Vario MT", brand: "Fendt", price: 465000, type: "tractor", category: "equipment" },
  { itemId: "FIAT_160_90_DT", itemName: "Fiat 160-90 DT", brand: "Fiat", type: "tractor", category: "equipment" },
  { itemId: "ISEKI_TJW", itemName: "Iseki TJW", brand: "Iseki", type: "tractor", category: "equipment" },
  { itemId: "JCB_FASTRAC_2170_4WS", itemName: "JCB Fastrac 2170 4WS", brand: "JCB", type: "tractor", category: "equipment" },
  { itemId: "JCB_FASTRAC_4220_ICON", itemName: "JCB Fastrac 4220 iCON", brand: "JCB", type: "tractor", category: "equipment" },
  { itemId: "JCB_FASTRAC_8330_ICON", itemName: "JCB Fastrac 8330 iCON", brand: "JCB", type: "tractor", category: "equipment" },
  { itemId: "JOHN_DEERE_3650", itemName: "John Deere 3650", brand: "John Deere", price: 45000, type: "tractor", category: "equipment" },
  { itemId: "JOHN_DEERE_6R_155", itemName: "John Deere 6R 155", brand: "John Deere", price: 182000, type: "tractor", category: "equipment" },
  { itemId: "JOHN_DEERE_6R_185", itemName: "John Deere 6R 185", brand: "John Deere", price: 182000, type: "tractor", category: "equipment" },
  { itemId: "JOHN_DEERE_6R_230", itemName: "John Deere 6R 230", brand: "John Deere", price: 268000, type: "tractor", category: "equipment" },
  { itemId: "JOHN_DEERE_6R_250", itemName: "John Deere 6R 250", brand: "John Deere", price: 268000, type: "tractor", category: "equipment" },
  { itemId: "JOHN_DEERE_7R_290", itemName: "John Deere 7R 290", brand: "John Deere", price: 298500, type: "tractor", category: "equipment" },
  { itemId: "JOHN_DEERE_7R_350", itemName: "John Deere 7R 350", brand: "John Deere", price: 298500, type: "tractor", category: "equipment" },
  { itemId: "JOHN_DEERE_8R_310", itemName: "John Deere 8R 310", brand: "John Deere", price: 312500, type: "tractor", category: "equipment" },
  { itemId: "JOHN_DEERE_8R_370", itemName: "John Deere 8R 370", brand: "John Deere", price: 312500, type: "tractor", category: "equipment" },
  { itemId: "JOHN_DEERE_8RT_370", itemName: "John Deere 8RT 370", brand: "John Deere", price: 405500, type: "tractor", category: "equipment" },
  { itemId: "JOHN_DEERE_8RX_410", itemName: "John Deere 8RX 410", brand: "John Deere", price: 478000, type: "tractor", category: "equipment" },
  { itemId: "JOHN_DEERE_9R_540", itemName: "John Deere 9R 540", brand: "John Deere", price: 468500, type: "tractor", category: "equipment" },
  { itemId: "JOHN_DEERE_9RX_640", itemName: "John Deere 9RX 640", brand: "John Deere", price: 545500, type: "tractor", category: "equipment" },
  { itemId: "JOHN_DEERE_9RX_830", itemName: "John Deere 9RX 830", brand: "John Deere", price: 695000, type: "tractor", category: "equipment" },
  { itemId: "KUBOTA_M8_231", itemName: "Kubota M8-231", brand: "Kubota", type: "tractor", category: "equipment" },
  { itemId: "LANDINI_REX_4_GT", itemName: "Landini REX 4 GT", brand: "Landini", type: "tractor", category: "equipment" },
  { itemId: "LINDNER_LINTRAC_130", itemName: "Lindner Lintrac 130", brand: "Lindner", type: "tractor", category: "equipment" },
  { itemId: "MASSEY_FERGUSON_5711S", itemName: "Massey Ferguson MF 5711 S", brand: "Massey Ferguson", price: 92500, type: "tractor", category: "equipment" },
  { itemId: "MASSEY_FERGUSON_7S_235", itemName: "Massey Ferguson MF 7S.235", brand: "Massey Ferguson", price: 149500, type: "tractor", category: "equipment" },
  { itemId: "MASSEY_FERGUSON_9S_425", itemName: "Massey Ferguson MF 9S.425", brand: "Massey Ferguson", price: 259000, type: "tractor", category: "equipment" },
  { itemId: "MCCORMICK_X8_VT_DRIVE", itemName: "McCormick X8 VT-Drive", brand: "McCormick", type: "tractor", category: "equipment" },
  { itemId: "MB_TRAC_700", itemName: "Mercedes-Benz MB-Trac 700", brand: "Mercedes-Benz", type: "tractor", category: "equipment" },
  { itemId: "MB_TRAC_1800_TURBO", itemName: "Mercedes-Benz MB-Trac 1800 Turbo", brand: "Mercedes-Benz", type: "tractor", category: "equipment" },
  { itemId: "UNIMOG_U_1800", itemName: "Mercedes-Benz Unimog U 1800", brand: "Mercedes-Benz", type: "tractor", category: "equipment" },
  { itemId: "UNIMOG_U_530", itemName: "Mercedes-Benz Unimog U 530", brand: "Mercedes-Benz", type: "tractor", category: "equipment" },
  { itemId: "NEW_HOLLAND_TK4_80_METHANE", itemName: "New Holland TK4.80 Methane Power", brand: "New Holland", price: 57500, type: "tractor", category: "equipment" },
  { itemId: "NEW_HOLLAND_T7_270", itemName: "New Holland T7.270 LWB PLMI", brand: "New Holland", price: 239500, type: "tractor", category: "equipment" },
  { itemId: "NEW_HOLLAND_T8_435", itemName: "New Holland T8.435 Genesis", brand: "New Holland", price: 292000, type: "tractor", category: "equipment" },
  { itemId: "NEW_HOLLAND_T8000_390", itemName: "New Holland T8000 390", brand: "New Holland", type: "tractor", category: "equipment" },
  { itemId: "RIGITRAC_SKH_60", itemName: "Rigitrac SKH 60", brand: "Rigitrac", type: "tractor", category: "equipment" },
  { itemId: "SAME_VIRTUS_135_RVSHIFT", itemName: "Same Virtus 135 RVShift", brand: "Same", type: "tractor", category: "equipment" },
  { itemId: "STEYR_ABSOLUT_6240_CVT", itemName: "STEYR Absolut 6240 CVT", brand: "STEYR", type: "tractor", category: "equipment" },
  { itemId: "VALTRA_T175", itemName: "Valtra T175", brand: "Valtra", price: 168000, type: "tractor", category: "equipment" },
  { itemId: "VALTRA_S394", itemName: "Valtra S394", brand: "Valtra", price: 254500, type: "tractor", category: "equipment" },
  { itemId: "VERSATILE_NEMESIS", itemName: "Versatile Nemesis", brand: "Versatile", type: "tractor", category: "equipment" },
  { itemId: "VERSATILE_1080_BIG_ROY", itemName: "Versatile 1080 Big Roy", brand: "Versatile", type: "tractor", category: "equipment" },
  { itemId: "VERSATILE_DELTATRACK", itemName: "Versatile DeltaTrack", brand: "Versatile", type: "tractor", category: "equipment" },
  { itemId: "AGCO_WHITE_8310", itemName: "AGCO White 8310", brand: "AGCO White", type: "tractor", category: "equipment" },
  { itemId: "ZETOR_PROXIMA_HS_120", itemName: "Zetor PROXIMA HS 120", brand: "Zetor", type: "tractor", category: "equipment" },
  { itemId: "ZETOR_FORTERRA_HSX_140", itemName: "Zetor FORTERRA HSX 140", brand: "Zetor", type: "tractor", category: "equipment" },
  { itemId: "ZETOR_CRYSTAL_HD_170", itemName: "Zetor CRYSTAL HD 170", brand: "Zetor", type: "tractor", category: "equipment" },

  // ── Combine Harvesters ────────────────────────────────────────────────────
  { itemId: "MASSEY_FERGUSON_MF_8570", itemName: "Massey Ferguson MF 8570", brand: "Massey Ferguson", price: 104500, type: "harvester", category: "equipment" },
  { itemId: "MASSEY_FERGUSON_BETA_7360", itemName: "Massey Ferguson Beta 7360 AL4", brand: "Massey Ferguson", price: 265000, type: "harvester", category: "equipment" },
  { itemId: "CLAAS_EVION_450", itemName: "CLAAS EVION 450", brand: "CLAAS", price: 226500, type: "harvester", category: "equipment" },
  { itemId: "CLAAS_LEXION_6900", itemName: "CLAAS LEXION 6900", brand: "CLAAS", price: 405500, type: "harvester", category: "equipment" },
  { itemId: "CLAAS_LEXION_8800", itemName: "CLAAS LEXION 8800", brand: "CLAAS", price: 653500, type: "harvester", category: "equipment" },
  { itemId: "CLAAS_LEXION_8900", itemName: "CLAAS LEXION 8900", brand: "CLAAS", price: 653500, type: "harvester", category: "equipment" },
  { itemId: "FENDT_5275_C_SL", itemName: "Fendt 5275 C SL", brand: "Fendt", price: 265000, type: "harvester", category: "equipment" },
  { itemId: "NEW_HOLLAND_CH7_70", itemName: "New Holland CH7.70", brand: "New Holland", price: 281000, type: "harvester", category: "equipment" },
  { itemId: "NEW_HOLLAND_CR11", itemName: "New Holland CR11", brand: "New Holland", price: 740000, type: "harvester", category: "equipment" },
  { itemId: "NEW_HOLLAND_CR11_GOLD", itemName: "New Holland CR11 Gold Edition", brand: "New Holland", price: 740000, type: "harvester", category: "equipment" },
  { itemId: "CASE_IH_AXIAL_FLOW_7150", itemName: "Case IH Axial-Flow 7150", brand: "Case IH", price: 301500, type: "harvester", category: "equipment" },
  { itemId: "CASE_IH_AF11", itemName: "Case IH AF11", brand: "Case IH", price: 740000, type: "harvester", category: "equipment" },
  { itemId: "JOHN_DEERE_S7_800", itemName: "John Deere S7.800", brand: "John Deere", price: 381000, type: "harvester", category: "equipment" },
  { itemId: "JOHN_DEERE_S7_850", itemName: "John Deere S7.850", brand: "John Deere", price: 381000, type: "harvester", category: "equipment" },
  { itemId: "JOHN_DEERE_S7_900", itemName: "John Deere S7.900", brand: "John Deere", price: 381000, type: "harvester", category: "equipment" },
  { itemId: "JOHN_DEERE_X9_1100", itemName: "John Deere X9 1100", brand: "John Deere", price: 744500, type: "harvester", category: "equipment" },

  // ── Forage Harvesters ─────────────────────────────────────────────────────
  { itemId: "LACOTEC_LH_II", itemName: "Lacotec LH II", brand: "Lacotec", price: 85000, type: "forage_harvester", category: "equipment" },
  { itemId: "FENDT_KATANA_65", itemName: "Fendt Katana 65", brand: "Fendt", price: 469500, type: "forage_harvester", category: "equipment" },
  { itemId: "FENDT_KATANA_85", itemName: "Fendt Katana 85", brand: "Fendt", price: 469500, type: "forage_harvester", category: "equipment" },
  { itemId: "JOHN_DEERE_9600", itemName: "John Deere 9600", brand: "John Deere", price: 499500, type: "forage_harvester", category: "equipment" },
  { itemId: "JOHN_DEERE_9900", itemName: "John Deere 9900", brand: "John Deere", price: 499500, type: "forage_harvester", category: "equipment" },
  { itemId: "NEW_HOLLAND_FR_780", itemName: "New Holland FR 780", brand: "New Holland", price: 495000, type: "forage_harvester", category: "equipment" },
  { itemId: "CLAAS_JAGUAR_990_TERRA_TRAC", itemName: "CLAAS JAGUAR 990 TERRA TRAC", brand: "CLAAS", price: 625500, type: "forage_harvester", category: "equipment" },
  { itemId: "KRONE_BIGX_1180", itemName: "KRONE BiG X 1180", brand: "KRONE", price: 659000, type: "forage_harvester", category: "equipment" },

  // ── Telehandlers ──────────────────────────────────────────────────────────
  { itemId: "FENDT_CARGO_T740", itemName: "Fendt Cargo T740", brand: "Fendt", price: 150500, type: "telehandler", category: "equipment" },
  { itemId: "JCB_541_70_AGRI_PRO", itemName: "JCB 541-70 AGRI PRO", brand: "JCB", price: 143000, type: "telehandler", category: "equipment" },
  { itemId: "MANITOU_MLT_841_145", itemName: "Manitou MLT 841-145 PS+", brand: "Manitou", price: 139000, type: "telehandler", category: "equipment" },
  { itemId: "MERLO_MF44_9CS", itemName: "Merlo MF44.9CS-170-CVTRONIC", brand: "Merlo", price: 149500, type: "telehandler", category: "equipment" },
  { itemId: "SCHAFFER_9660_T2", itemName: "Schäffer 9660 T-2", brand: "Schäffer", type: "telehandler", category: "equipment" },
  { itemId: "SENNEBOGEN_340G", itemName: "Sennebogen 340G", brand: "Sennebogen", price: 145000, type: "telehandler", category: "equipment" },

  // ── Trucks ────────────────────────────────────────────────────────────────
  { itemId: "HEIZOMAT_HEIZOTRUCK_V2", itemName: "Heizomat Heizotruck V2", brand: "Heizomat", type: "truck", category: "equipment" },
  { itemId: "INTERNATIONAL_CV_SERIES", itemName: "International CV Series", brand: "International", price: 67500, type: "truck", category: "equipment" },
  { itemId: "INTERNATIONAL_LT_SERIES", itemName: "International LT Series", brand: "International", price: 67500, type: "truck", category: "equipment" },
  { itemId: "INTERNATIONAL_TRANSTAR_II", itemName: "International Transtar II Eagle", brand: "International", price: 45000, type: "truck", category: "equipment" },
  { itemId: "LIZARD_DRAGON", itemName: "Lizard Dragon", brand: "Lizard", type: "truck", category: "equipment" },
  { itemId: "MACK_ANTHEM_6X4", itemName: "Mack Trucks Anthem 6x4", brand: "Mack", price: 93500, type: "truck", category: "equipment" },
  { itemId: "MACK_BLACK_ANTHEM_6X4", itemName: "Mack Trucks Black Anthem 6x4", brand: "Mack", price: 143500, type: "truck", category: "equipment" },
  { itemId: "MACK_SUPER_LINER_6X4", itemName: "Mack Trucks Super-Liner 6x4", brand: "Mack", price: 110000, type: "truck", category: "equipment" },
  { itemId: "MERCEDES_ACTROS_L", itemName: "Mercedes-Benz Actros L", brand: "Mercedes-Benz", type: "truck", category: "equipment" },
  { itemId: "MERCEDES_AROCS", itemName: "Mercedes-Benz Arocs", brand: "Mercedes-Benz", type: "truck", category: "equipment" },
  { itemId: "VOLVO_FH16", itemName: "Volvo FH16", brand: "Volvo", price: 137000, type: "truck", category: "equipment" },
  { itemId: "VOLVO_FH_ELECTRIC", itemName: "Volvo FH Electric", brand: "Volvo", price: 145000, type: "truck", category: "equipment" },
  { itemId: "VOLVO_VNX_300", itemName: "Volvo VNX 300", brand: "Volvo", price: 149500, type: "truck", category: "equipment" },

  // ── Trailers ──────────────────────────────────────────────────────────────
  { itemId: "SALEK_ANS_1900", itemName: "Salek ANS-1900", brand: "Salek", type: "trailer", category: "equipment" },
  { itemId: "FARMTECH_DDK_2400", itemName: "Farmtech DDK 2400", brand: "Farmtech", type: "trailer", category: "equipment" },
  { itemId: "KRAMPE_HALFPIPE_HP20", itemName: "Krampe HALFPIPE HP 20", brand: "Krampe", price: 36000, type: "trailer", category: "equipment" },
  { itemId: "KRAMPE_BIG_BODY_750S", itemName: "Krampe Big Body 750 S", brand: "Krampe", price: 35500, type: "trailer", category: "equipment" },
  { itemId: "BRANTNER_Z18051_XXL", itemName: "Brantner Z 18051/2 XXL Power Flex", brand: "Brantner", price: 26000, type: "trailer", category: "equipment" },
  { itemId: "BRANTNER_DD24073_XXL", itemName: "Brantner DD 24073/2 XXL", brand: "Brantner", price: 39500, type: "trailer", category: "equipment" },
  { itemId: "FLIEGL_ASW_271", itemName: "Fliegl ASW 271", brand: "Fliegl", price: 52000, type: "trailer", category: "equipment" },
  { itemId: "KAWECO_RADIUM_255", itemName: "Kaweco Radium 255", brand: "Kaweco", price: 68500, type: "trailer", category: "equipment" },
  { itemId: "KRONE_GX_520", itemName: "KRONE GX 520", brand: "KRONE", price: 132500, type: "trailer", category: "equipment" },
  { itemId: "KRONE_GX_AGRILINER_520", itemName: "KRONE GX AgriLiner 520", brand: "KRONE", price: 95000, type: "trailer", category: "equipment" },
  { itemId: "BERGMANN_HTW_65", itemName: "Bergmann HTW 65", brand: "Bergmann", price: 99500, type: "trailer", category: "equipment" },
  { itemId: "RUDOLPH_TDK_301_RP", itemName: "Rudolph TDK 301 RP", brand: "Rudolph", type: "trailer", category: "equipment" },
  { itemId: "FLIEGL_DTS_5_9", itemName: "Fliegl DTS 5.9", brand: "Fliegl", price: 30500, type: "trailer", category: "equipment" },
  { itemId: "SCHWARZMULLER_LOW_LOADER_4A", itemName: "Schwarzmüller Low Loader 4A", brand: "Schwarzmüller", type: "trailer", category: "equipment" },
  { itemId: "LODE_KING_DISTINCTION", itemName: "Lode King Distinction Triple Hopper", brand: "Lode King", type: "trailer", category: "equipment" },
  { itemId: "KRAMPE_SKS_30_1050", itemName: "Krampe SKS 30/1050", brand: "Krampe", price: 95000, type: "trailer", category: "equipment" },
  { itemId: "PITTS_LT40_8L", itemName: "PITTS Trailers LT40-8L", brand: "PITTS", type: "trailer", category: "equipment" },
  { itemId: "FLIEGL_VARIO_CHASSIS_V2", itemName: "Fliegl Vario Chassis V2", brand: "Fliegl", price: 29000, type: "trailer", category: "equipment" },

  // ── Auger Wagons / Grain Carts ────────────────────────────────────────────
  { itemId: "FLIEGL_BUFFEL", itemName: "Fliegl Büffel", brand: "Fliegl", price: 117000, type: "auger_wagon", category: "equipment" },
  { itemId: "HAWE_KUW_2000", itemName: "Hawe KUW 2000", brand: "Hawe", type: "auger_wagon", category: "equipment" },
  { itemId: "DEMCO_850_GRAIN_CART", itemName: "Demco 850 Single Auger Grain Cart", brand: "Demco", type: "auger_wagon", category: "equipment" },
  { itemId: "BERGMANN_GTW_330", itemName: "Bergmann GTW 330", brand: "Bergmann", price: 91000, type: "auger_wagon", category: "equipment" },
  { itemId: "JM_1112_XTENDED", itemName: "J&M X-Tended Reach 1112", brand: "J&M", type: "auger_wagon", category: "equipment" },
  { itemId: "BRANDT_2500_DXT", itemName: "Brandt 2500 DXT", brand: "Brandt", type: "auger_wagon", category: "equipment" },
  { itemId: "WALKABOUT_WMB_4000", itemName: "Walkabout WMB 4000", brand: "Walkabout", type: "auger_wagon", category: "equipment" },
  { itemId: "HAWE_SUW_5000", itemName: "Hawe SUW 5000", brand: "Hawe", type: "auger_wagon", category: "equipment" },

  // ── Plows ─────────────────────────────────────────────────────────────────
  { itemId: "POTTINGER_SERVO_25", itemName: "Pöttinger SERVO 25", brand: "Pöttinger", price: 14000, type: "plow", category: "equipment" },
  { itemId: "LEMKEN_JUWEL_6_M_V", itemName: "LEMKEN Juwel 6 M V", brand: "LEMKEN", price: 14500, type: "plow", category: "equipment" },
  { itemId: "AGROMASZ_POV_5_XL", itemName: "AGROMASZ POV 5 XL", brand: "AGROMASZ", price: 16000, type: "plow", category: "equipment" },
  { itemId: "POTTINGER_SERVO_T6000_P", itemName: "Pöttinger SERVO T 6000 P", brand: "Pöttinger", price: 50500, type: "plow", category: "equipment" },
  { itemId: "LEMKEN_TITAN_18", itemName: "LEMKEN Titan 18", brand: "LEMKEN", price: 59000, type: "plow", category: "equipment" },
  { itemId: "KVERNELAND_PW100_12", itemName: "Kverneland PW 100-12", brand: "Kverneland", price: 75000, type: "plow", category: "equipment" },

  // ── Cultivators ───────────────────────────────────────────────────────────
  { itemId: "KNOCHE_ECO_CULTIVATOR_300", itemName: "Knoche ECO-CULTIVATOR 300", brand: "Knoche", type: "cultivator", category: "equipment" },
  { itemId: "JOHN_DEERE_980", itemName: "John Deere 980", brand: "John Deere", price: 9500, type: "cultivator", category: "equipment" },
  { itemId: "AMAZONE_CENIO_4000", itemName: "AMAZONE Cenio 4000 Super", brand: "AMAZONE", price: 24500, type: "cultivator", category: "equipment" },
  { itemId: "AGROMASZ_GRIZZLY_X4", itemName: "AGROMASZ GRIZZLY X4", brand: "AGROMASZ", price: 28000, type: "cultivator", category: "equipment" },
  { itemId: "LEMKEN_SMARAGD_9_500K", itemName: "LEMKEN Smaragd 9/500K", brand: "LEMKEN", price: 24500, type: "cultivator", category: "equipment" },
  { itemId: "HORSCH_TIGER_8_MT", itemName: "HORSCH Tiger 8 MT", brand: "HORSCH", price: 79500, type: "cultivator", category: "equipment" },
  { itemId: "POTTINGER_TERRIA_6040", itemName: "Pöttinger TERRIA 6040", brand: "Pöttinger", price: 54000, type: "cultivator", category: "equipment" },
  { itemId: "VADERSTAD_TOPDOWN_600", itemName: "Väderstad TopDown 600", brand: "Väderstad", price: 90000, type: "cultivator", category: "equipment" },
  { itemId: "VADERSTAD_NZ_EXTREME_1425", itemName: "Väderstad NZ Extreme 1425", brand: "Väderstad", price: 128000, type: "cultivator", category: "equipment" },
  { itemId: "KUHN_PROLANDER_7500", itemName: "KUHN PROLANDER 7500", brand: "KUHN", price: 50500, type: "cultivator", category: "equipment" },
  { itemId: "SUMMERS_SUPERCHISEL_CP2050", itemName: "Summers Superchisel CP2050", brand: "Summers", type: "cultivator", category: "equipment" },

  // ── Disc Harrows ──────────────────────────────────────────────────────────
  { itemId: "KNOCHE_CROSSMAX_300", itemName: "Knoche CROSSMAX 300", brand: "Knoche", type: "disc_harrow", category: "equipment" },
  { itemId: "UNIA_ARES_XL", itemName: "Unia ARES XL", brand: "Unia", type: "disc_harrow", category: "equipment" },
  { itemId: "VADERSTAD_CARRIER_XL_625", itemName: "Väderstad Carrier XL 625", brand: "Väderstad", price: 75000, type: "disc_harrow", category: "equipment" },
  { itemId: "DALBO_POWERCHAIN_800", itemName: "Dalbo POWERCHAIN 800", brand: "Dalbo", type: "disc_harrow", category: "equipment" },
  { itemId: "POTTINGER_TERRADISC_10001T", itemName: "Pöttinger Terradisc 10001T", brand: "Pöttinger", price: 90500, type: "disc_harrow", category: "equipment" },
  { itemId: "FARMET_SOFTER_11_PS", itemName: "Farmet Softer 11 PS", brand: "Farmet", type: "disc_harrow", category: "equipment" },
  { itemId: "KINZE_MACH_TILL_412", itemName: "KINZE Mach Till 412", brand: "KINZE", type: "disc_harrow", category: "equipment" },
  { itemId: "BEDNAR_SWIFTERDISC_18400", itemName: "Bednar SWIFTERDISC XE 18400 MEGA", brand: "Bednar", price: 194500, type: "disc_harrow", category: "equipment" },
  { itemId: "SALFORD_INDEPENDENT_1260", itemName: "Salford Independent Series 1260", brand: "Salford", type: "disc_harrow", category: "equipment" },

  // ── Subsoilers ────────────────────────────────────────────────────────────
  { itemId: "AGRISEM_COMBIPLOW_GOLD", itemName: "AGRISEM Combiplow Gold", brand: "AGRISEM", type: "subsoiler", category: "equipment" },
  { itemId: "ALPEGO_K_DYNO_5_200", itemName: "ALPEGO K-Dyno 5-200", brand: "ALPEGO", type: "subsoiler", category: "equipment" },
  { itemId: "ALPEGO_K_FORCE_400", itemName: "ALPEGO K-Force 400", brand: "ALPEGO", type: "subsoiler", category: "equipment" },
  { itemId: "ALPEGO_K_EXTREME_11_500", itemName: "ALPEGO K-Extreme 11-500", brand: "ALPEGO", type: "subsoiler", category: "equipment" },
  { itemId: "AGRISEM_DISC_O_VIGNE_V", itemName: "AGRISEM Disc-O-Vigne V", brand: "AGRISEM", type: "subsoiler", category: "equipment" },

  // ── Mulchers ──────────────────────────────────────────────────────────────
  { itemId: "TMC_CANCELA_TPN_140", itemName: "TMC Cancela TPN 140", brand: "TMC Cancela", type: "mulcher", category: "equipment" },
  { itemId: "TMC_CANCELA_TDE_220", itemName: "TMC Cancela TDE-220", brand: "TMC Cancela", type: "mulcher", category: "equipment" },
  { itemId: "BEDNAR_MULCHER_MM_7000", itemName: "Bednar MULCHER MM 7000", brand: "Bednar", price: 35000, type: "mulcher", category: "equipment" },
  { itemId: "HORSCH_CULTRO_12_TC", itemName: "HORSCH Cultro 12 TC", brand: "HORSCH", price: 78000, type: "mulcher", category: "equipment" },
  { itemId: "KNOCHE_SPEEDMAX_560", itemName: "Knoche SPEEDMAX 560", brand: "Knoche", type: "mulcher", category: "equipment" },

  // ── Seeders / Drills / Planters ───────────────────────────────────────────
  { itemId: "HORSCH_VERSA_3_KR", itemName: "HORSCH Versa 3 KR", brand: "HORSCH", price: 25500, type: "seeder", category: "equipment" },
  { itemId: "UNIA_FENIX_3000", itemName: "Unia FENIX 3000/3", brand: "Unia", type: "seeder", category: "equipment" },
  { itemId: "GREAT_PLAINS_SOLID_STAND_1500", itemName: "Great Plains SOLID STAND 1500", brand: "Great Plains", type: "seeder", category: "equipment" },
  { itemId: "AGROMASZ_AQUILA_DRIVE_400", itemName: "AGROMASZ AQUILA DRIVE 400", brand: "AGROMASZ", price: 58500, type: "seeder", category: "equipment" },
  { itemId: "POTTINGER_AEROSEM_5000_DD", itemName: "Pöttinger AEROSEM VT 5000 DD", brand: "Pöttinger", price: 101500, type: "seeder", category: "equipment" },
  { itemId: "BEDNAR_OMEGA_OO_6000_FL", itemName: "Bednar Omega OO 6000 FL", brand: "Bednar", price: 116500, type: "seeder", category: "equipment" },
  { itemId: "KUHN_ESPRO_6000_RC", itemName: "KUHN ESPRO 6000 RC", brand: "KUHN", price: 125500, type: "seeder", category: "equipment" },
  { itemId: "LEMKEN_SOLITAIR_12", itemName: "LEMKEN Solitair 12", brand: "LEMKEN", price: 165000, type: "seeder", category: "equipment" },
  { itemId: "HORSCH_AVATAR_12_25_SD", itemName: "HORSCH Avatar 12.25 SD", brand: "HORSCH", price: 195000, type: "seeder", category: "equipment" },
  { itemId: "AMAZONE_CITAN_15001C", itemName: "AMAZONE Citan 15001-C", brand: "AMAZONE", price: 206500, type: "seeder", category: "equipment" },
  { itemId: "VADERSTAD_SEED_HAWK_84", itemName: "Väderstad Seed Hawk 84", brand: "Väderstad", type: "seeder", category: "equipment" },
  { itemId: "MZURI_PRO_TIL_4T_XZACT", itemName: "MZURI PRO-TIL 4T Xzact", brand: "MZURI", type: "seeder", category: "equipment" },
  { itemId: "AMAZONE_PRECEA_4500_2C", itemName: "AMAZONE Precea 4500-2C Super", brand: "AMAZONE", price: 49500, type: "seeder", category: "equipment" },
  { itemId: "HORSCH_MAESTRO_9_75_RX", itemName: "HORSCH Maestro 9.75 RX", brand: "HORSCH", price: 65000, type: "seeder", category: "equipment" },
  { itemId: "HORSCH_MAESTRO_24_50_SV", itemName: "HORSCH Maestro 24.50 SV", brand: "HORSCH", price: 208000, type: "seeder", category: "equipment" },
  { itemId: "GRIMME_MATRIX_1800", itemName: "Grimme MATRIX 1800", brand: "Grimme", type: "seeder", category: "equipment" },
  { itemId: "KVERNELAND_OPTIMA_RS", itemName: "Kverneland Optima RS", brand: "Kverneland", price: 89500, type: "seeder", category: "equipment" },
  { itemId: "KINZE_4905_BLUE_DRIVE", itemName: "KINZE 4905 Blue Drive", brand: "KINZE", type: "seeder", category: "equipment" },
  { itemId: "VADERSTAD_TEMPO_K_24", itemName: "Väderstad Tempo K 24", brand: "Väderstad", type: "seeder", category: "equipment" },
  { itemId: "KUHN_MAXIMA_3_TI_L", itemName: "KUHN MAXIMA 3 TI L", brand: "KUHN", price: 59000, type: "seeder", category: "equipment" },

  // ── Sprayers ──────────────────────────────────────────────────────────────
  { itemId: "HARDI_MEGA_1200L", itemName: "Hardi MEGA 1200L", brand: "Hardi", price: 30500, type: "sprayer", category: "equipment" },
  { itemId: "BERTHOUD_VANTAGE_4300", itemName: "Berthoud Vantage 4300", brand: "Berthoud", type: "sprayer", category: "equipment" },
  { itemId: "HARDI_AEON_5200", itemName: "Hardi AEON 5200 DELTA FORCE", brand: "Hardi", price: 74000, type: "sprayer", category: "equipment" },
  { itemId: "AMAZONE_UX_5201_SUPER", itemName: "AMAZONE UX 5201 Super", brand: "AMAZONE", price: 79500, type: "sprayer", category: "equipment" },
  { itemId: "AGRIO_DINO_II", itemName: "Agrio DINO II", brand: "Agrio", type: "sprayer", category: "equipment" },
  { itemId: "CASE_IH_PATRIOT_4450", itemName: "Case IH Patriot 4450", brand: "Case IH", price: 417000, type: "sprayer", category: "equipment" },
  { itemId: "AGRIFAC_CONDOR_ENDURANCE_II", itemName: "Agrifac Condor Endurance II", brand: "Agrifac", price: 420500, type: "sprayer", category: "equipment" },
  { itemId: "FENDT_ROGATOR_900", itemName: "Fendt Rogator 900", brand: "Fendt", type: "sprayer", category: "equipment" },
  { itemId: "DAMMANN_PROFI_CLASS_TRIDEM", itemName: "Dammann Profi-Class Tridem", brand: "Dammann", type: "sprayer", category: "equipment" },

  // ── Fertilizer Spreaders ──────────────────────────────────────────────────
  { itemId: "AMAZONE_ZA_TS_3200", itemName: "AMAZONE ZA-TS 3200", brand: "AMAZONE", price: 25000, type: "spreader", category: "equipment" },
  { itemId: "BREDAL_K105", itemName: "BREDAL K105", brand: "BREDAL", type: "spreader", category: "equipment" },
  { itemId: "AMAZONE_ZG_TS_10001", itemName: "AMAZONE ZG-TS 10001", brand: "AMAZONE", price: 65000, type: "spreader", category: "equipment" },
  { itemId: "STREUMASTER_FW_212_TD", itemName: "STREUMASTER FW 212 TD PROFI", brand: "STREUMASTER", type: "spreader", category: "equipment" },
  { itemId: "SALFORD_9620_AIR_BOOM", itemName: "Salford 9620 Air Boom Applicator", brand: "Salford", type: "spreader", category: "equipment" },
  { itemId: "AGRISPREAD_AS2100_SCS", itemName: "AgriSpread AS2100 SCS", brand: "AgriSpread", type: "spreader", category: "equipment" },

  // ── Manure Spreaders ──────────────────────────────────────────────────────
  { itemId: "FARMTECH_VARIOFEX_750", itemName: "Farmtech Variofex 750", brand: "Farmtech", type: "manure_spreader", category: "equipment" },
  { itemId: "BRANTNER_TA_12050", itemName: "Brantner TA 12050 Power Spread +", brand: "Brantner", price: 31500, type: "manure_spreader", category: "equipment" },
  { itemId: "HAWE_DST_16", itemName: "Hawe DST 16", brand: "Hawe", type: "manure_spreader", category: "equipment" },
  { itemId: "BERGMANN_TSW_6240_W", itemName: "Bergmann TSW 6240 W", brand: "Bergmann", price: 110000, type: "manure_spreader", category: "equipment" },
  { itemId: "SAMSON_US_235_DYNAMIC", itemName: "Samson Agro US 235 Dynamic", brand: "Samson", type: "manure_spreader", category: "equipment" },
  { itemId: "BUNNING_LOWLANDER_250_HBD", itemName: "Bunning Lowlander WideBody 250 HBD", brand: "Bunning", type: "manure_spreader", category: "equipment" },

  // ── Slurry Tankers ────────────────────────────────────────────────────────
  { itemId: "FARMTECH_SUPERCIS_800", itemName: "Farmtech Supercis 800", brand: "Farmtech", type: "slurry_tanker", category: "equipment" },
  { itemId: "ANNABURGER_AW_22_27", itemName: "ANNABURGER AW 22.27", brand: "ANNABURGER", type: "slurry_tanker", category: "equipment" },
  { itemId: "FLIEGL_PFW_18000", itemName: "Fliegl PFW 18000 MaxxLine Plus", brand: "Fliegl", price: 102000, type: "slurry_tanker", category: "equipment" },
  { itemId: "KAWECO_PROFI_II", itemName: "Kaweco Profi II", brand: "Kaweco", price: 60500, type: "slurry_tanker", category: "equipment" },
  { itemId: "SAMSON_PG_II_28_GENESIS", itemName: "Samson Agro PG II 28 Genesis", brand: "Samson", type: "slurry_tanker", category: "equipment" },
  { itemId: "KOTTE_PQ_32000", itemName: "Kotte PQ 32.000", brand: "Kotte", type: "slurry_tanker", category: "equipment" },

  // ── Mowers ────────────────────────────────────────────────────────────────
  { itemId: "KUHN_GMD_3123_F", itemName: "KUHN GMD 3123 F", brand: "KUHN", price: 13500, type: "mower", category: "equipment" },
  { itemId: "SAMASZ_KDF_341_S", itemName: "Samasz KDF 341 S", brand: "Samasz", price: 14000, type: "mower", category: "equipment" },
  { itemId: "SAMASZ_XT_390", itemName: "Samasz XT 390", brand: "Samasz", price: 16500, type: "mower", category: "equipment" },
  { itemId: "VERMEER_TM_1410", itemName: "Vermeer TM 1410", brand: "Vermeer", type: "mower", category: "equipment" },
  { itemId: "ELHO_DUETT_7300", itemName: "ELHO Duett 7300", brand: "ELHO", type: "mower", category: "equipment" },
  { itemId: "KUHN_GMD_8730_FF", itemName: "KUHN GMD 8730-FF", brand: "KUHN", price: 35000, type: "mower", category: "equipment" },
  { itemId: "SAMASZ_KDD_941_STH", itemName: "Samasz KDD 941 STH", brand: "Samasz", price: 70500, type: "mower", category: "equipment" },
  { itemId: "KRONE_BIG_M_450", itemName: "KRONE BiG M 450", brand: "KRONE", price: 468000, type: "mower", category: "equipment" },

  // ── Tedders ───────────────────────────────────────────────────────────────
  { itemId: "POTTINGER_ALPINHIT_4_4H", itemName: "Pöttinger ALPINHIT 4.4 H", brand: "Pöttinger", price: 6000, type: "tedder", category: "equipment" },
  { itemId: "KRONE_VENDRO_820_HIGHLAND", itemName: "KRONE Vendro 820 Highland", brand: "KRONE", price: 15500, type: "tedder", category: "equipment" },
  { itemId: "SAMASZ_P8_890", itemName: "Samasz P8-890", brand: "Samasz", price: 16500, type: "tedder", category: "equipment" },
  { itemId: "POTTINGER_HIT_16_18_T", itemName: "Pöttinger HIT 16.18 T", brand: "Pöttinger", price: 44000, type: "tedder", category: "equipment" },

  // ── Windrowers / Rakes ────────────────────────────────────────────────────
  { itemId: "SIP_FAVORIT_254", itemName: "SIP Favorit 254", brand: "SIP", type: "windrower", category: "equipment" },
  { itemId: "SIP_AIR_300_F_ALP", itemName: "SIP Air 300 F Alp", brand: "SIP", type: "windrower", category: "equipment" },
  { itemId: "KRONE_SWADRO_S_350", itemName: "KRONE Swadro S 350 Highland", brand: "KRONE", price: 6500, type: "windrower", category: "equipment" },
  { itemId: "KUHN_GA_4731", itemName: "KUHN GA 4731", brand: "KUHN", price: 9000, type: "windrower", category: "equipment" },
  { itemId: "SAMASZ_Z2_840_H", itemName: "Samasz Z2-840 H", brand: "Samasz", price: 19500, type: "windrower", category: "equipment" },
  { itemId: "KRONE_SWADRO_TS_970", itemName: "KRONE Swadro TS 970", brand: "KRONE", price: 60000, type: "windrower", category: "equipment" },
  { itemId: "ANDERSON_MERGEPRO_915", itemName: "Anderson Group MERGEPRO 915", brand: "Anderson Group", type: "windrower", category: "equipment" },
  { itemId: "POTTINGER_TOP_1403_C", itemName: "Pöttinger TOP 1403 C", brand: "Pöttinger", price: 92000, type: "windrower", category: "equipment" },

  // ── Balers ────────────────────────────────────────────────────────────────
  { itemId: "MASSEY_FERGUSON_MF_1840", itemName: "Massey Ferguson MF 1840", brand: "Massey Ferguson", price: 22000, type: "baler", category: "equipment" },
  { itemId: "KUHN_SB_1290_ID", itemName: "KUHN SB 1290 iD", brand: "KUHN", price: 164000, type: "baler", category: "equipment" },
  { itemId: "CLAAS_QUADRANT_5300_FC", itemName: "CLAAS QUADRANT 5300 FC", brand: "CLAAS", price: 171000, type: "baler", category: "equipment" },
  { itemId: "MASSEY_FERGUSON_MF_2370_UHD", itemName: "Massey Ferguson MF 2370 Ultra HD", brand: "Massey Ferguson", price: 175000, type: "baler", category: "equipment" },
  { itemId: "FENDT_SQUADRA_1290_N", itemName: "Fendt Squadra 1290 N UD", brand: "Fendt", price: 175000, type: "baler", category: "equipment" },
  { itemId: "KRONE_BIGPACK_1290_HDP_VC", itemName: "KRONE BiG Pack 1290 HDP VC", brand: "KRONE", price: 208000, type: "baler", category: "equipment" },
  { itemId: "KRONE_BIGPACK_1290_HDP_II_XC", itemName: "KRONE BiG Pack 1290 HDP II XC", brand: "KRONE", price: 208000, type: "baler", category: "equipment" },
  { itemId: "GOWEIL_G1_F125", itemName: "Göweil G-1 F125", brand: "Göweil", type: "baler", category: "equipment" },
  { itemId: "NEW_HOLLAND_PRO_BELT_165", itemName: "New Holland Pro-Belt 165", brand: "New Holland", price: 65000, type: "baler", category: "equipment" },
  { itemId: "CASE_IH_RB_456_HD_PRO", itemName: "Case IH RB 456 HD Pro", brand: "Case IH", price: 65000, type: "baler", category: "equipment" },
  { itemId: "KUHN_VB_3190", itemName: "KUHN VB 3190", brand: "KUHN", price: 69500, type: "baler", category: "equipment" },
  { itemId: "KRONE_VARIPACK_V_190_XC", itemName: "KRONE VariPack V 190 XC Plus", brand: "KRONE", price: 69500, type: "baler", category: "equipment" },
  { itemId: "JOHN_DEERE_C441R", itemName: "John Deere C441R", brand: "John Deere", price: 112500, type: "baler", category: "equipment" },
  { itemId: "MASSEY_FERGUSON_RB_4160V", itemName: "Massey Ferguson MF RB 4160V Protec", brand: "Massey Ferguson", price: 121250, type: "baler", category: "equipment" },
  { itemId: "FENDT_ROTANA_160_V", itemName: "Fendt Rotana 160 V Combi", brand: "Fendt", price: 121250, type: "baler", category: "equipment" },
  { itemId: "CLAAS_ROLLANT_520_RC", itemName: "CLAAS ROLLANT 520 RC", brand: "CLAAS", type: "baler", category: "equipment" },
  { itemId: "CLAAS_ROLLANT_630_RC", itemName: "CLAAS ROLLANT 630 RC UNIWRAP", brand: "CLAAS", type: "baler", category: "equipment" },
  { itemId: "VERMEER_ZR5_1200", itemName: "Vermeer ZR5-1200", brand: "Vermeer", type: "baler", category: "equipment" },
  { itemId: "ANDERSON_BIOBALER_WB55", itemName: "Anderson Group BioBaler WB-55", brand: "Anderson Group", type: "baler", category: "equipment" },

  // ── Grain Headers ─────────────────────────────────────────────────────────
  { itemId: "CLAAS_VARIO_620", itemName: "CLAAS VARIO 620", brand: "CLAAS", price: 52000, type: "grain_header", category: "equipment" },
  { itemId: "CLAAS_CONVIO_FLEX_1080", itemName: "CLAAS CONVIO FLEX 1080", brand: "CLAAS", price: 106000, type: "grain_header", category: "equipment" },
  { itemId: "CLAAS_CONVIO_FLEX_1380", itemName: "CLAAS CONVIO FLEX 1380", brand: "CLAAS", price: 136000, type: "grain_header", category: "equipment" },
  { itemId: "CASE_IH_3020_TERRAFLEX_25FT", itemName: "Case IH 3020 TerraFlex 25FT", brand: "Case IH", price: 42500, type: "grain_header", category: "equipment" },
  { itemId: "CASE_IH_3050_TERRAFLEX_28FT", itemName: "Case IH 3050 TerraFlex 28FT", brand: "Case IH", price: 48000, type: "grain_header", category: "equipment" },
  { itemId: "NEW_HOLLAND_VARIFEED_28FT", itemName: "New Holland Varifeed 28FT", brand: "New Holland", price: 48000, type: "grain_header", category: "equipment" },
  { itemId: "JOHN_DEERE_RDF35", itemName: "John Deere RDF35", brand: "John Deere", price: 105000, type: "grain_header", category: "equipment" },
  { itemId: "JOHN_DEERE_HD45X", itemName: "John Deere HD45X", brand: "John Deere", price: 135000, type: "grain_header", category: "equipment" },
  { itemId: "MACDON_FD250_FLEXDRAPER", itemName: "MacDon FD250 FlexDraper", brand: "MacDon", type: "grain_header", category: "equipment" },
  { itemId: "MASSEY_FERGUSON_FREEFLOW_25FT", itemName: "Massey Ferguson MF FreeFlow 25FT", brand: "Massey Ferguson", price: 35000, type: "grain_header", category: "equipment" },

  // ── Corn Headers ──────────────────────────────────────────────────────────
  { itemId: "NEW_HOLLAND_980CR_8_30", itemName: "New Holland 980CR 8-30", brand: "New Holland", price: 53000, type: "corn_header", category: "equipment" },
  { itemId: "CASE_IH_4408", itemName: "Case IH 4408", brand: "Case IH", price: 53000, type: "corn_header", category: "equipment" },
  { itemId: "CAPELLO_DIAMANT_8", itemName: "Capello Diamant 8", brand: "Capello", type: "corn_header", category: "equipment" },
  { itemId: "GERINGHOFF_NORTHSTAR_1230", itemName: "GERINGHOFF NorthStar 1230 FB", brand: "GERINGHOFF", type: "corn_header", category: "equipment" },
  { itemId: "CASE_IH_4418_N", itemName: "Case IH 4418 N", brand: "Case IH", price: 88000, type: "corn_header", category: "equipment" },
  { itemId: "NEW_HOLLAND_980CR_18_30", itemName: "New Holland 980CR 18-30", brand: "New Holland", price: 88000, type: "corn_header", category: "equipment" },
  { itemId: "JOHN_DEERE_C16F", itemName: "John Deere C16F", brand: "John Deere", type: "corn_header", category: "equipment" },
  { itemId: "GERINGHOFF_NORTHSTAR_1830", itemName: "GERINGHOFF NorthStar 1830", brand: "GERINGHOFF", type: "corn_header", category: "equipment" },

  // ── Commodities ───────────────────────────────────────────────────────────
  { itemId: "COMMODITY_WHEAT", itemName: "Wheat", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_BARLEY", itemName: "Barley", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_OAT", itemName: "Oat", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_CANOLA", itemName: "Canola", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_CORN", itemName: "Corn", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_SOYBEANS", itemName: "Soybeans", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_SUNFLOWERS", itemName: "Sunflowers", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_SUGAR_BEET", itemName: "Sugar Beet", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_POTATOES", itemName: "Potatoes", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_COTTON", itemName: "Cotton", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_SUGARCANE", itemName: "Sugarcane", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_GRASS", itemName: "Grass", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_STRAW", itemName: "Straw", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_HAY", itemName: "Hay", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_SILAGE", itemName: "Silage", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_CHAFF", itemName: "Chaff", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_RICE", itemName: "Rice", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_LONG_GRAIN_RICE", itemName: "Long Grain Rice", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_SPINACH", itemName: "Spinach", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_PEAS", itemName: "Peas", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_GREEN_BEANS", itemName: "Green Beans", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_FERTILIZER", itemName: "Fertilizer", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_LIQUID_FERTILIZER", itemName: "Liquid Fertilizer", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_SEEDS", itemName: "Seeds", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_WOOD_CHIPS", itemName: "Wood Chips", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_LOGS", itemName: "Logs", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_MANURE", itemName: "Manure", brand: "Commodity", type: "commodity", category: "commodity" },
  { itemId: "COMMODITY_SLURRY", itemName: "Slurry", brand: "Commodity", type: "commodity", category: "commodity" },
];
