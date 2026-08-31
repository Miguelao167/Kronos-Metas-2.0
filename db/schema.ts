import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const calls=sqliteTable('calls',{id:integer('id').primaryKey(),company:text('company').notNull(),niche:text('niche').notNull(),result:text('result').notNull(),date:text('date').notNull()});
export const sales=sqliteTable('sales',{id:integer('id').primaryKey(),company:text('company').notNull(),type:text('type').notNull(),value:real('value').notNull(),received:real('received').notNull(),date:text('date').notNull()});
export const leads=sqliteTable('leads',{id:integer('id').primaryKey(),company:text('company').notNull(),niche:text('niche').notNull(),status:text('status').notNull(),potential:real('potential').notNull(),next:text('next').notNull()});

