import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  AcademicResource,
  SearchQuery,
  SearchResult,
} from '../interfaces/academic-resource.interface';

/**
 * Libro curado disponible en Internet Archive
 */
interface CuratedTextbook {
  identifier: string;
  title: string;
  authors: string[];
  language: string;
  description?: string;
}

/**
 * Configuración de carrera universitaria
 */
export interface CareerConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  categories: string[];
  keywords: string[];
}

/**
 * Carreras universitarias disponibles en Argentina
 */
export const CAREERS: CareerConfig[] = [
  {
    id: 'medicina',
    name: 'Medicina',
    description: 'Ciencias médicas y de la salud',
    icon: 'Stethoscope',
    gradient: 'from-red-500 to-rose-500',
    categories: ['anatomy', 'physiology', 'pathology', 'pharmacology', 'clinical'],
    keywords: ['medicina', 'medical', 'salud', 'health', 'clínica', 'hospital'],
  },
  {
    id: 'kinesiology',
    name: 'Kinesiología',
    description: 'Fisioterapia y rehabilitación',
    icon: 'Activity',
    gradient: 'from-amber-500 to-orange-500',
    categories: ['anatomy', 'physiology', 'biomechanics', 'rehabilitation'],
    keywords: ['kinesiología', 'fisioterapia', 'rehabilitación', 'movimiento'],
  },
  {
    id: 'enfermeria',
    name: 'Enfermería',
    description: 'Cuidados de enfermería y salud',
    icon: 'Heart',
    gradient: 'from-pink-500 to-rose-500',
    categories: ['anatomy', 'physiology', 'nursing', 'clinical'],
    keywords: ['enfermería', 'nursing', 'cuidados', 'paciente'],
  },
  {
    id: 'psicologia',
    name: 'Psicología',
    description: 'Ciencias del comportamiento y mente',
    icon: 'Brain',
    gradient: 'from-purple-500 to-violet-500',
    categories: ['psychology', 'neuroscience', 'clinical_psych'],
    keywords: ['psicología', 'psychology', 'mente', 'comportamiento', 'terapia'],
  },
  {
    id: 'derecho',
    name: 'Derecho',
    description: 'Ciencias jurídicas y legales',
    icon: 'Scale',
    gradient: 'from-slate-600 to-slate-800',
    categories: ['civil_law', 'criminal_law', 'constitutional', 'commercial'],
    keywords: ['derecho', 'law', 'legal', 'código', 'jurídico'],
  },
  {
    id: 'informatica',
    name: 'Ingeniería Informática',
    description: 'Sistemas, programación y tecnología',
    icon: 'Code',
    gradient: 'from-blue-500 to-cyan-500',
    categories: ['programming', 'algorithms', 'databases', 'networks', 'ai'],
    keywords: ['informática', 'programación', 'software', 'sistemas', 'computer'],
  },
  {
    id: 'contador',
    name: 'Contador Público',
    description: 'Contabilidad y finanzas',
    icon: 'Calculator',
    gradient: 'from-emerald-500 to-teal-500',
    categories: ['accounting', 'finance', 'economics', 'taxes'],
    keywords: ['contabilidad', 'finanzas', 'impuestos', 'accounting', 'balance'],
  },
  {
    id: 'arquitectura',
    name: 'Arquitectura',
    description: 'Diseño y construcción',
    icon: 'Building',
    gradient: 'from-orange-500 to-amber-600',
    categories: ['architecture', 'design', 'construction', 'urbanism'],
    keywords: ['arquitectura', 'diseño', 'construcción', 'edificio', 'planos'],
  },
  {
    id: 'administracion',
    name: 'Administración',
    description: 'Gestión empresarial y negocios',
    icon: 'Briefcase',
    gradient: 'from-indigo-500 to-blue-600',
    categories: ['management', 'marketing', 'economics', 'hr'],
    keywords: ['administración', 'gestión', 'empresa', 'management', 'negocios'],
  },
  {
    id: 'ingenieria_civil',
    name: 'Ingeniería Civil',
    description: 'Construcción e infraestructura',
    icon: 'HardHat',
    gradient: 'from-yellow-500 to-orange-500',
    categories: ['structures', 'materials', 'hydraulics', 'geotechnics'],
    keywords: ['civil', 'estructuras', 'construcción', 'obras', 'puentes'],
  },
];

/**
 * Biblioteca curada de libros por categoría - Internet Archive
 */
export const CURATED_TEXTBOOKS: Record<string, CuratedTextbook[]> = {
  // ==================== MEDICINA / SALUD ====================
  anatomy: [
    {
      identifier: 'anatomiahumanalatarjetruizliard4edtomoi',
      title: 'Anatomía Humana - Latarjet & Ruiz Liard - 4ta Ed. Tomo I',
      authors: ['Michel Latarjet', 'Alfredo Ruiz Liard'],
      language: 'es',
      description: 'Texto clásico de anatomía en español',
    },
    {
      identifier: 'LatarjetRuizLiardAnatomiaHumanaTomoII4Edicion.pdf',
      title: 'Anatomía Humana - Latarjet & Ruiz Liard - 4ta Ed. Tomo II',
      authors: ['Michel Latarjet', 'Alfredo Ruiz Liard'],
      language: 'es',
    },
    {
      identifier: 'latarjet-ruiz-liard-anatomia-humana-5a-edicion-t-2',
      title: 'Anatomía Humana - Latarjet & Ruiz Liard - 5ta Ed. Tomo II',
      authors: ['Michel Latarjet', 'Alfredo Ruiz Liard'],
      language: 'es',
    },
    {
      identifier: 'tratado-de-anatomia-humana-testut-latarjet-tomo-i',
      title: 'Tratado de Anatomía Humana - Testut & Latarjet Tomo I',
      authors: ['L. Testut', 'A. Latarjet'],
      language: 'es',
    },
    {
      identifier: 'principles-of-anatomy-and-physiology-15th-edition',
      title: 'Principles of Anatomy and Physiology - 15th Edition',
      authors: ['Gerard J. Tortora', 'Bryan Derrickson'],
      language: 'en',
      description: 'El Tortora, referencia mundial en anatomía',
    },
    {
      identifier: 'tortora-13-principios-de-anatomia-y-fisiologia',
      title: 'Principios de Anatomía y Fisiología - Tortora 13° Ed.',
      authors: ['Gerard J. Tortora', 'Bryan Derrickson'],
      language: 'es',
      description: 'Versión en español del clásico Tortora',
    },
    {
      identifier: 'isbn_9781119146445',
      title: 'Introduction to the Human Body: Essentials of Anatomy and Physiology',
      authors: ['Gerard J. Tortora', 'Bryan Derrickson'],
      language: 'en',
    },
    {
      identifier: 'gray-anatomia-para-estudiantes-3a-edicion',
      title: 'Gray Anatomía para Estudiantes - 3ra Edición',
      authors: ['Richard L. Drake', 'A. Wayne Vogl', 'Adam W. M. Mitchell'],
      language: 'es',
      description: 'Gray simplificado para estudiantes',
    },
  ],
  physiology: [
    {
      identifier: 'guyton-and-hall-textbook-of-medical-physiology-14ed',
      title: 'Guyton and Hall Textbook of Medical Physiology - 14th Ed. (2021)',
      authors: ['John E. Hall', 'Michael E. Hall'],
      language: 'en',
      description: 'La biblia de la fisiología médica',
    },
    {
      identifier: 'guytonandhalltextbookofmedicalphysiology12thed_202004',
      title: 'Guyton and Hall Textbook of Medical Physiology - 12th Ed.',
      authors: ['John E. Hall', 'Arthur C. Guyton'],
      language: 'en',
    },
    {
      identifier: 'TextbookOfMedicalPhysiology',
      title: 'Textbook of Medical Physiology - 11th Ed.',
      authors: ['Arthur C. Guyton', 'John E. Hall'],
      language: 'en',
    },
    {
      identifier: 'ganong-fisiologia-medica-25-edicion',
      title: 'Ganong Fisiología Médica - 25° Edición',
      authors: ['Kim E. Barrett', 'Susan M. Barman'],
      language: 'es',
      description: 'Otro clásico de fisiología',
    },
  ],
  biomechanics: [
    {
      identifier: '382169905kapandjithephysiologyofthejointsvolume1theupperlimb',
      title: 'The Physiology of the Joints Vol. 1 - Upper Limb',
      authors: ['I. A. Kapandji'],
      language: 'en',
      description: 'Kapandji - Miembro superior',
    },
    {
      identifier: 'kapandjithephysiologyofthejointsvolume3thevertebralcolumnpelvicgirdleandhead2008',
      title: 'The Physiology of the Joints Vol. 3 - Spine, Pelvis & Head',
      authors: ['I. A. Kapandji'],
      language: 'en',
    },
    {
      identifier: 'fisiologia-articular-tomo-3-6ta-edicion-kapandji',
      title: 'Fisiología Articular - Tomo 3 - 6ta Edición',
      authors: ['I. A. Kapandji'],
      language: 'es',
    },
  ],
  pathology: [
    {
      identifier: 'robbins-cotran-pathologic-basis-of-disease-9th-edition',
      title: 'Robbins & Cotran Pathologic Basis of Disease - 9th Ed.',
      authors: ['Vinay Kumar', 'Abul K. Abbas', 'Jon C. Aster'],
      language: 'en',
      description: 'El Robbins, texto fundamental de patología',
    },
  ],
  pharmacology: [
    {
      identifier: 'goodman-gilman-pharmacological-basis-therapeutics-13th',
      title: 'Goodman & Gilman - The Pharmacological Basis of Therapeutics',
      authors: ['Laurence L. Brunton'],
      language: 'en',
      description: 'Referencia en farmacología',
    },
  ],
  clinical: [
    {
      identifier: 'harrison-principios-de-medicina-interna-20-edicion',
      title: 'Harrison - Principios de Medicina Interna - 20° Ed.',
      authors: ['J. Larry Jameson', 'Anthony S. Fauci'],
      language: 'es',
      description: 'Harrison, el clásico de medicina interna',
    },
  ],
  nursing: [
    {
      identifier: 'fundamentos-de-enfermeria-kozier-erb',
      title: 'Fundamentos de Enfermería - Kozier & Erb',
      authors: ['Audrey Berman', 'Shirlee Snyder'],
      language: 'es',
      description: 'Texto base para enfermería',
    },
  ],
  rehabilitation: [
    {
      identifier: 'therapeutic-exercise-foundations-techniques-kisner',
      title: 'Therapeutic Exercise: Foundations and Techniques',
      authors: ['Carolyn Kisner', 'Lynn Allen Colby'],
      language: 'en',
      description: 'Ejercicio terapéutico para kinesiología',
    },
  ],

  // ==================== PSICOLOGÍA ====================
  psychology: [
    {
      identifier: 'psicologia-morris-maisto-13-edicion',
      title: 'Psicología - Morris & Maisto - 13° Edición',
      authors: ['Charles G. Morris', 'Albert A. Maisto'],
      language: 'es',
      description: 'Introducción a la psicología',
    },
    {
      identifier: 'psicologia-social-david-myers',
      title: 'Psicología Social - David Myers',
      authors: ['David G. Myers'],
      language: 'es',
    },
  ],
  neuroscience: [
    {
      identifier: 'principios-de-neurociencia-kandel-5ed',
      title: 'Principios de Neurociencia - Kandel - 5° Ed.',
      authors: ['Eric R. Kandel', 'James H. Schwartz'],
      language: 'es',
      description: 'El Kandel, texto de neurociencia',
    },
  ],
  clinical_psych: [
    {
      identifier: 'dsm-5-manual-diagnostico-estadistico',
      title: 'DSM-5 Manual Diagnóstico y Estadístico',
      authors: ['American Psychiatric Association'],
      language: 'es',
      description: 'Manual diagnóstico de trastornos mentales',
    },
  ],

  // ==================== DERECHO ====================
  civil_law: [
    {
      identifier: 'codigocivildela00srgoog',
      title: 'Código Civil de la República Argentina (Histórico)',
      authors: ['Dalmacio Vélez Sársfield'],
      language: 'es',
      description: 'Código Civil histórico de Argentina',
    },
    {
      identifier: 'manual-de-derecho-civil-borda-parte-general',
      title: 'Manual de Derecho Civil - Parte General',
      authors: ['Guillermo A. Borda'],
      language: 'es',
      description: 'Clásico del derecho civil argentino',
    },
  ],
  criminal_law: [
    {
      identifier: 'derecho-penal-parte-general-zaffaroni',
      title: 'Derecho Penal - Parte General',
      authors: ['Eugenio Raúl Zaffaroni'],
      language: 'es',
      description: 'Zaffaroni - Referencia en derecho penal',
    },
  ],
  constitutional: [
    {
      identifier: 'derecho-constitucional-argentino-bidart-campos',
      title: 'Derecho Constitucional Argentino',
      authors: ['Germán J. Bidart Campos'],
      language: 'es',
      description: 'Constitucional argentino por Bidart Campos',
    },
  ],
  commercial: [
    {
      identifier: 'tratado-derecho-comercial-fontanarrosa',
      title: 'Tratado de Derecho Comercial',
      authors: ['Rodolfo O. Fontanarrosa'],
      language: 'es',
    },
  ],

  // ==================== INFORMÁTICA ====================
  programming: [
    {
      identifier: 'fundamentos-de-programacion-4ta-edicion-luis-joyanes-aguilar',
      title: 'Fundamentos de Programación - 4ta Edición',
      authors: ['Luis Joyanes Aguilar'],
      language: 'es',
      description: 'Algoritmos y estructuras de datos',
    },
    {
      identifier: 'clean-code-robert-c-martin',
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      authors: ['Robert C. Martin'],
      language: 'en',
      description: 'Código limpio - Best practices',
    },
    {
      identifier: 'the-pragmatic-programmer-20th-anniversary',
      title: 'The Pragmatic Programmer - 20th Anniversary Edition',
      authors: ['David Thomas', 'Andrew Hunt'],
      language: 'en',
      description: 'Clásico para todo programador',
    },
  ],
  algorithms: [
    {
      identifier: 'introduction-to-algorithms-3rd-edition-cormen',
      title: 'Introduction to Algorithms - CLRS 3rd Edition',
      authors: ['Thomas H. Cormen', 'Charles E. Leiserson'],
      language: 'en',
      description: 'La biblia de los algoritmos',
    },
    {
      identifier: 'estructuras-de-datos-en-java-mark-allen-weiss',
      title: 'Estructuras de Datos en Java',
      authors: ['Mark Allen Weiss'],
      language: 'es',
    },
  ],
  databases: [
    {
      identifier: 'fundamentos-de-bases-de-datos-silberschatz-6ed',
      title: 'Fundamentos de Bases de Datos - 6ta Ed.',
      authors: ['Abraham Silberschatz', 'Henry F. Korth'],
      language: 'es',
      description: 'Texto clásico de bases de datos',
    },
  ],
  networks: [
    {
      identifier: 'redes-de-computadoras-tanenbaum-5ed',
      title: 'Redes de Computadoras - 5ta Ed.',
      authors: ['Andrew S. Tanenbaum', 'David J. Wetherall'],
      language: 'es',
      description: 'El Tanenbaum de redes',
    },
  ],
  ai: [
    {
      identifier: 'artificial-intelligence-modern-approach-russell-norvig',
      title: 'Artificial Intelligence: A Modern Approach',
      authors: ['Stuart Russell', 'Peter Norvig'],
      language: 'en',
      description: 'El libro de IA de Russell & Norvig',
    },
  ],

  // ==================== CONTABILIDAD / ECONOMÍA ====================
  accounting: [
    {
      identifier: 'contabilidad-general-horngren-harrison',
      title: 'Contabilidad - Horngren, Harrison',
      authors: ['Charles T. Horngren', 'Walter T. Harrison'],
      language: 'es',
      description: 'Texto base de contabilidad',
    },
  ],
  finance: [
    {
      identifier: 'principios-de-finanzas-corporativas-brealey-myers',
      title: 'Principios de Finanzas Corporativas',
      authors: ['Richard A. Brealey', 'Stewart C. Myers'],
      language: 'es',
      description: 'Brealey Myers - Finanzas corporativas',
    },
  ],
  economics: [
    {
      identifier: 'principios-de-economia-mankiw-7ed',
      title: 'Principios de Economía - Mankiw 7° Ed.',
      authors: ['N. Gregory Mankiw'],
      language: 'es',
      description: 'Introducción a la economía',
    },
    {
      identifier: 'macroeconomia-blanchard-6ed',
      title: 'Macroeconomía - Blanchard 6° Ed.',
      authors: ['Olivier Blanchard'],
      language: 'es',
    },
  ],
  taxes: [
    {
      identifier: 'impuestos-explicados-para-todos',
      title: 'Manual de Impuestos Argentinos',
      authors: ['Autores Varios'],
      language: 'es',
    },
  ],

  // ==================== ADMINISTRACIÓN ====================
  management: [
    {
      identifier: 'administracion-robbins-coulter-14ed',
      title: 'Administración - Robbins & Coulter - 14° Ed.',
      authors: ['Stephen P. Robbins', 'Mary Coulter'],
      language: 'es',
      description: 'Texto clásico de administración',
    },
  ],
  marketing: [
    {
      identifier: 'marketing-kotler-armstrong-16ed',
      title: 'Marketing - Kotler & Armstrong - 16° Ed.',
      authors: ['Philip Kotler', 'Gary Armstrong'],
      language: 'es',
      description: 'El Kotler de marketing',
    },
  ],
  hr: [
    {
      identifier: 'administracion-recursos-humanos-chiavenato',
      title: 'Administración de Recursos Humanos',
      authors: ['Idalberto Chiavenato'],
      language: 'es',
    },
  ],

  // ==================== ARQUITECTURA ====================
  architecture: [
    {
      identifier: 'neufert-arte-proyectar-arquitectura',
      title: 'El Arte de Proyectar en Arquitectura - Neufert',
      authors: ['Ernst Neufert'],
      language: 'es',
      description: 'El Neufert, referencia en arquitectura',
    },
  ],
  design: [
    {
      identifier: 'historia-de-la-arquitectura-moderna-benevolo',
      title: 'Historia de la Arquitectura Moderna',
      authors: ['Leonardo Benevolo'],
      language: 'es',
    },
  ],
  construction: [
    {
      identifier: 'materiales-de-construccion-para-edificacion',
      title: 'Materiales de Construcción para Edificación',
      authors: ['Autores Varios'],
      language: 'es',
    },
  ],
  urbanism: [
    {
      identifier: 'urbanismo-teoria-practica-fernando-chueca',
      title: 'Breve Historia del Urbanismo',
      authors: ['Fernando Chueca Goitia'],
      language: 'es',
    },
  ],

  // ==================== INGENIERÍA CIVIL ====================
  structures: [
    {
      identifier: 'resistencia-de-materiales-timoshenko',
      title: 'Resistencia de Materiales - Timoshenko',
      authors: ['Stephen P. Timoshenko'],
      language: 'es',
      description: 'Clásico de resistencia de materiales',
    },
  ],
  materials: [
    {
      identifier: 'ciencia-ingenieria-materiales-callister',
      title: 'Ciencia e Ingeniería de los Materiales',
      authors: ['William D. Callister'],
      language: 'es',
    },
  ],
  hydraulics: [
    {
      identifier: 'mecanica-de-fluidos-cengel-cimbala',
      title: 'Mecánica de Fluidos - Çengel & Cimbala',
      authors: ['Yunus A. Çengel', 'John M. Cimbala'],
      language: 'es',
    },
  ],
  geotechnics: [
    {
      identifier: 'mecanica-de-suelos-terzaghi',
      title: 'Mecánica de Suelos',
      authors: ['Karl Terzaghi', 'Ralph B. Peck'],
      language: 'es',
    },
  ],
};

// Categorías compuestas para carreras
CURATED_TEXTBOOKS['kinesiology_all'] = [
  ...CURATED_TEXTBOOKS.anatomy,
  ...CURATED_TEXTBOOKS.physiology,
  ...CURATED_TEXTBOOKS.biomechanics,
  ...CURATED_TEXTBOOKS.rehabilitation,
];

CURATED_TEXTBOOKS['medicina_all'] = [
  ...CURATED_TEXTBOOKS.anatomy,
  ...CURATED_TEXTBOOKS.physiology,
  ...CURATED_TEXTBOOKS.pathology,
  ...CURATED_TEXTBOOKS.pharmacology,
  ...CURATED_TEXTBOOKS.clinical,
];

CURATED_TEXTBOOKS['informatica_all'] = [
  ...CURATED_TEXTBOOKS.programming,
  ...CURATED_TEXTBOOKS.algorithms,
  ...CURATED_TEXTBOOKS.databases,
  ...CURATED_TEXTBOOKS.networks,
  ...CURATED_TEXTBOOKS.ai,
];

CURATED_TEXTBOOKS['derecho_all'] = [
  ...CURATED_TEXTBOOKS.civil_law,
  ...CURATED_TEXTBOOKS.criminal_law,
  ...CURATED_TEXTBOOKS.constitutional,
  ...CURATED_TEXTBOOKS.commercial,
];

CURATED_TEXTBOOKS['psicologia_all'] = [
  ...CURATED_TEXTBOOKS.psychology,
  ...CURATED_TEXTBOOKS.neuroscience,
  ...CURATED_TEXTBOOKS.clinical_psych,
];

CURATED_TEXTBOOKS['contador_all'] = [
  ...CURATED_TEXTBOOKS.accounting,
  ...CURATED_TEXTBOOKS.finance,
  ...CURATED_TEXTBOOKS.economics,
  ...CURATED_TEXTBOOKS.taxes,
];

CURATED_TEXTBOOKS['administracion_all'] = [
  ...CURATED_TEXTBOOKS.management,
  ...CURATED_TEXTBOOKS.marketing,
  ...CURATED_TEXTBOOKS.economics,
  ...CURATED_TEXTBOOKS.hr,
];

CURATED_TEXTBOOKS['arquitectura_all'] = [
  ...CURATED_TEXTBOOKS.architecture,
  ...CURATED_TEXTBOOKS.design,
  ...CURATED_TEXTBOOKS.construction,
  ...CURATED_TEXTBOOKS.urbanism,
];

CURATED_TEXTBOOKS['ingenieria_civil_all'] = [
  ...CURATED_TEXTBOOKS.structures,
  ...CURATED_TEXTBOOKS.materials,
  ...CURATED_TEXTBOOKS.hydraulics,
  ...CURATED_TEXTBOOKS.geotechnics,
];

CURATED_TEXTBOOKS['enfermeria_all'] = [
  ...CURATED_TEXTBOOKS.anatomy,
  ...CURATED_TEXTBOOKS.physiology,
  ...CURATED_TEXTBOOKS.nursing,
  ...CURATED_TEXTBOOKS.clinical,
];

export type TextbookCategory = string;

/**
 * Archive.org (Internet Archive) provider for free books, manuals, and educational content
 */
@Injectable()
export class ArchiveOrgProvider {
  private readonly logger = new Logger(ArchiveOrgProvider.name);
  private readonly baseUrl = 'https://archive.org';

  constructor(private readonly http: HttpService) {}

  async search(query: SearchQuery): Promise<SearchResult> {
    const { query: searchTerm, filters, pagination } = query;
    const page = pagination?.page || 1;
    const perPage = pagination?.perPage || 25;

    try {
      // Build search query for educational content
      // mediatype:texts includes books, manuals, documents
      // mediatype:movies includes educational videos
      const mediaTypes = ['texts', 'education'];
      const mediaTypeQuery = mediaTypes.map(t => `mediatype:${t}`).join(' OR ');

      const params = new URLSearchParams({
        q: `(${searchTerm}) AND (${mediaTypeQuery})`,
        output: 'json',
        rows: String(perPage),
        page: String(page),
        'fl[]': 'identifier,title,creator,description,date,mediatype,downloads,subject,language',
      });

      const response = await firstValueFrom(
        this.http.get(`${this.baseUrl}/advancedsearch.php?${params}`),
      );

      const docs = response.data.response?.docs || [];
      const items: AcademicResource[] = docs.map((doc: any) =>
        this.mapToAcademicResource(doc),
      );

      return {
        items,
        total: response.data.response?.numFound || 0,
        page,
        perPage,
        source: 'archive_org',
      };
    } catch (error) {
      this.logger.error(`Archive.org search error: ${error}`);
      return {
        items: [],
        total: 0,
        page,
        perPage,
        source: 'archive_org',
      };
    }
  }

  private mapToAcademicResource(doc: any): AcademicResource {
    const identifier = doc.identifier;
    const isBook = doc.mediatype === 'texts';

    // Determine the type based on mediatype
    let type: string = 'other';
    if (doc.mediatype === 'texts') {
      type = 'book';
    } else if (doc.mediatype === 'movies' || doc.mediatype === 'education') {
      type = 'video';
    } else if (doc.mediatype === 'audio') {
      type = 'course';
    }

    // Build URLs
    const url = `${this.baseUrl}/details/${identifier}`;
    const pdfUrl = isBook ? `${this.baseUrl}/download/${identifier}/${identifier}.pdf` : null;
    const thumbnailUrl = `${this.baseUrl}/services/img/${identifier}`;

    // Parse authors
    let authors: string[] = [];
    if (doc.creator) {
      authors = Array.isArray(doc.creator) ? doc.creator : [doc.creator];
    }

    // Parse subjects/tags
    let subjects: string[] = [];
    if (doc.subject) {
      subjects = Array.isArray(doc.subject) ? doc.subject : [doc.subject];
    }

    return {
      externalId: identifier,
      source: 'archive_org' as const,
      title: doc.title || 'Sin título',
      authors: authors.length > 0 ? authors : ['Autor desconocido'],
      abstract: doc.description || null,
      publicationDate: doc.date || null,
      citationCount: doc.downloads || null, // Use downloads as a popularity metric
      url,
      pdfUrl,
      doi: null,
      type,
      isOpenAccess: true, // Archive.org content is free
      thumbnailUrl,
      subjects,
      language: doc.language,
    };
  }

  /**
   * Get metadata for a specific item
   */
  async getById(identifier: string): Promise<AcademicResource | null> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.baseUrl}/metadata/${identifier}`),
      );

      const metadata = response.data.metadata;
      if (!metadata) return null;

      return this.mapToAcademicResource({
        identifier,
        ...metadata,
      });
    } catch (error) {
      this.logger.error(`Archive.org getById error: ${error}`);
      return null;
    }
  }

  /**
   * Search specifically for textbooks
   */
  async searchTextbooks(query: SearchQuery): Promise<SearchResult> {
    const modifiedQuery = {
      ...query,
      query: `${query.query} (textbook OR manual OR "course material" OR apuntes)`,
    };
    return this.search(modifiedQuery);
  }

  /**
   * Get curated textbooks by category
   */
  async getCuratedTextbooks(category: TextbookCategory = 'kinesiology'): Promise<AcademicResource[]> {
    const textbooks = CURATED_TEXTBOOKS[category] || CURATED_TEXTBOOKS.kinesiology;

    const resources: AcademicResource[] = textbooks.map((book) => ({
      externalId: book.identifier,
      source: 'archive_org' as const,
      title: book.title,
      authors: book.authors,
      abstract: `Libro de texto disponible en Internet Archive. Acceso gratuito.`,
      publicationDate: null,
      citationCount: null,
      url: `${this.baseUrl}/details/${book.identifier}`,
      pdfUrl: `${this.baseUrl}/download/${book.identifier}/${book.identifier}.pdf`,
      doi: null,
      type: 'book',
      isOpenAccess: true,
      thumbnailUrl: `${this.baseUrl}/services/img/${book.identifier}`,
      subjects: [category],
      language: book.language,
    }));

    return resources;
  }

  /**
   * Get all available textbook categories
   */
  getTextbookCategories(): string[] {
    return Object.keys(CURATED_TEXTBOOKS);
  }

  /**
   * Search with medical/kinesiology focus
   */
  async searchMedicalTextbooks(searchTerm: string): Promise<SearchResult> {
    const medicalTerms = [
      'anatomy',
      'physiology',
      'kinesiology',
      'biomechanics',
      'medical',
      'anatomia',
      'fisiologia',
      'kinesiologia',
    ];

    const query: SearchQuery = {
      query: `(${searchTerm}) AND (${medicalTerms.join(' OR ')})`,
      pagination: { page: 1, perPage: 50 },
    };

    return this.search(query);
  }

  // ==================== CAREER SYSTEM ====================

  /**
   * Get all available careers
   */
  getCareers(): CareerConfig[] {
    return CAREERS;
  }

  /**
   * Get a specific career by ID
   */
  getCareerById(careerId: string): CareerConfig | null {
    return CAREERS.find(c => c.id === careerId) || null;
  }

  /**
   * Get textbooks for a specific career
   */
  async getTextbooksForCareer(careerId: string): Promise<AcademicResource[]> {
    const career = this.getCareerById(careerId);
    if (!career) {
      return [];
    }

    // Try to get combined category first (e.g., medicina_all)
    const combinedKey = `${careerId}_all`;
    if (CURATED_TEXTBOOKS[combinedKey]) {
      return this.getCuratedTextbooks(combinedKey);
    }

    // Otherwise, combine books from all career categories
    const allBooks: AcademicResource[] = [];
    const seenIds = new Set<string>();

    for (const category of career.categories) {
      const books = await this.getCuratedTextbooks(category);
      for (const book of books) {
        if (!seenIds.has(book.externalId)) {
          seenIds.add(book.externalId);
          allBooks.push(book);
        }
      }
    }

    return allBooks;
  }

  /**
   * Get smart recommendations based on subject name
   * Analyzes the subject name to determine which career/category it matches
   */
  async getSmartRecommendations(subjectName: string): Promise<{
    career: CareerConfig | null;
    recommendations: AcademicResource[];
    matchedKeywords: string[];
  }> {
    const normalizedName = subjectName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Find matching career based on keywords
    let bestMatch: CareerConfig | null = null;
    let maxMatches = 0;
    let matchedKeywords: string[] = [];

    for (const career of CAREERS) {
      const matches: string[] = [];
      for (const keyword of career.keywords) {
        const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalizedName.includes(normalizedKeyword)) {
          matches.push(keyword);
        }
      }
      if (matches.length > maxMatches) {
        maxMatches = matches.length;
        bestMatch = career;
        matchedKeywords = matches;
      }
    }

    // Also check category keywords
    const categoryKeywords: Record<string, string[]> = {
      anatomy: ['anatomia', 'anatomy', 'cuerpo humano', 'musculos', 'huesos', 'osteologia'],
      physiology: ['fisiologia', 'physiology', 'funciones', 'sistemas'],
      biomechanics: ['biomecanica', 'biomechanics', 'movimiento', 'articular'],
      pathology: ['patologia', 'pathology', 'enfermedades'],
      pharmacology: ['farmacologia', 'pharmacology', 'drogas', 'medicamentos'],
      psychology: ['psicologia', 'psychology', 'mente', 'conducta'],
      programming: ['programacion', 'programming', 'codigo', 'software', 'desarrollo'],
      algorithms: ['algoritmos', 'algorithms', 'estructuras de datos'],
      accounting: ['contabilidad', 'accounting', 'balance', 'costos'],
      civil_law: ['civil', 'obligaciones', 'contratos'],
      criminal_law: ['penal', 'delitos', 'criminal'],
    };

    // Find best matching category
    let bestCategory: string | null = null;
    let categoryMaxMatches = 0;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      let matches = 0;
      for (const keyword of keywords) {
        if (normalizedName.includes(keyword)) {
          matches++;
        }
      }
      if (matches > categoryMaxMatches) {
        categoryMaxMatches = matches;
        bestCategory = category;
      }
    }

    // Get recommendations
    let recommendations: AcademicResource[] = [];

    if (bestCategory && categoryMaxMatches > 0) {
      // If we found a specific category match, use that
      recommendations = await this.getCuratedTextbooks(bestCategory);
    } else if (bestMatch) {
      // Otherwise use the career-based recommendations
      recommendations = await this.getTextbooksForCareer(bestMatch.id);
    }

    return {
      career: bestMatch,
      recommendations: recommendations.slice(0, 10), // Limit to top 10
      matchedKeywords,
    };
  }

  /**
   * Get categories for a specific career
   */
  getCategoriesForCareer(careerId: string): string[] {
    const career = this.getCareerById(careerId);
    return career?.categories || [];
  }

  /**
   * Get all categories with their book counts
   */
  getAllCategoriesWithCounts(): { category: string; count: number }[] {
    return Object.entries(CURATED_TEXTBOOKS)
      .filter(([key]) => !key.endsWith('_all')) // Exclude combined categories
      .map(([category, books]) => ({
        category,
        count: books.length,
      }))
      .sort((a, b) => b.count - a.count);
  }
}
