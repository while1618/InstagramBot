import { Mongo } from 'meteor/mongo';

export const Profiles = new Mongo.Collection('profiles');
export const TempProfiles = new Mongo.Collection('tempProfiles');