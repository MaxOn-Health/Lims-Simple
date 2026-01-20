import { QueryRunner, Repository, EntityTarget, ObjectLiteral, SelectQueryBuilder, FindOptionsWhere, FindManyOptions } from 'typeorm';

/**
 * TransactionalRepository
 *
 * A wrapper class that proxies all Repository methods to use a QueryRunner's Entity Manager.
 * This ensures all database operations use the same transaction.
 *
 * @example
 * ```typescript
 * @Transactional()
 * async myMethod() {
 *   const qr = this.transactionManager.getCurrentTransaction();
 *   const patientRepo = new TransactionalRepository(this.patientsRepository, qr);
 *
 *   // All operations use the same transaction
 *   const patient = await patientRepo.findOne({ where: { id } });
 *   await patientRepo.save(patient);
 * }
 * ```
 */
export class TransactionalRepository<Entity extends ObjectLiteral> {
  private readonly baseRepository: Repository<Entity>;

  constructor(repository: Repository<Entity>, private readonly queryRunner: QueryRunner) {
    this.baseRepository = repository;
    this.proxyMethods();
  }

  /**
   * Get the transactional entity manager
   */
  private get manager() {
    return this.queryRunner.manager;
  }

  /**
   * Proxy all common Repository methods to use the QueryRunner's manager
   */
  private proxyMethods(): void {
    const methodsToProxy: (keyof Repository<Entity>)[] = [
      'find',
      'findAndCount',
      'findOne',
      'findOneBy',
      'findBy',
      'count',
      'exists',
      'save',
      'remove',
      'update',
      'delete',
      'insert',
      'upsert',
      'softDelete',
      'softRemove',
      'restore',
      'recover',
      'preload',
      'create',
      'merge',
      'clear',
      'hasId',
    ];

    methodsToProxy.forEach((method) => {
      if (typeof this.baseRepository[method] === 'function') {
        (this as any)[method] = (...args: any[]) => {
          const repository = this.manager.getRepository(this.baseRepository.target);
          return (repository as any)[method](...args);
        };
      }
    });
  }

  // Type declarations for proxied methods - these exist at runtime via proxyMethods()
  find: (options?: FindManyOptions<Entity>) => Promise<Entity[]>;
  findAndCount: (options?: FindManyOptions<Entity>) => Promise<[Entity[], number]>;
  findOne: (options: any) => Promise<Entity | null>;
  findOneBy: (where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[]) => Promise<Entity | null>;
  findBy: (where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[]) => Promise<Entity[]>;
  count: (options?: any) => Promise<number>;
  exists: (options?: any) => Promise<boolean>;
  save: Entity extends ObjectLiteral ? (entity: Entity) => Promise<Entity> : never;
  remove: (entity: Entity) => Promise<Entity>;
  update: (criteria: any, partialEntity: any) => Promise<any>;
  delete: (criteria: any) => Promise<any>;
  insert: (entity: any) => Promise<any>;
  upsert: (entity: any) => Promise<any>;
  softDelete: (criteria: any) => Promise<any>;
  softRemove: (entity: Entity) => Promise<Entity>;
  restore: (criteria: any) => Promise<any>;
  recover: (entity: Entity) => Promise<Entity>;
  preload: (entityLike: any) => Promise<Entity | undefined>;
  create: (entityLike: any) => Entity;
  merge: (entity: Entity, ...entityLikes: any[]) => Entity;
  clear: () => Promise<void>;
  hasId: (entity: Entity) => boolean;

  /**
   * Get the underlying repository metadata (target, metadata, etc.)
   */
  get target(): EntityTarget<Entity> {
    return this.baseRepository.target;
  }

  get metadata() {
    return this.baseRepository.metadata;
  }

  get queryBuilder(): SelectQueryBuilder<Entity> {
    return this.manager.createQueryBuilder(this.baseRepository.target, this.baseRepository.metadata.tableName);
  }

  /**
   * Create a QueryBuilder for this repository
   */
  createQueryBuilder(alias?: string): SelectQueryBuilder<Entity> {
    return this.manager.createQueryBuilder(
      this.baseRepository.target,
      alias || this.baseRepository.metadata.tableName,
    );
  }

  /**
   * Get a repository with the QueryRunner's manager
   */
  getRepository<T extends ObjectLiteral>(target: EntityTarget<T>): Repository<T> {
    return this.manager.getRepository(target);
  }

  /**
   * Execute a raw query
   */
  async query(query: string, parameters?: any[]): Promise<any> {
    return this.queryRunner.query(query, parameters);
  }
}

/**
 * DeepPartial type for TypeORM
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};
