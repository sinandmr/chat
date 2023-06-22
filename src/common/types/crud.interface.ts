export interface ICRUDQueries {
  skip?: number; // offset
  take?: number; // limit
  where?: { [key: string]: any }; // filters
  orderBy?: { [key: string]: any }; // order
  include?: { [key: string]: any }; // with
  select?: { [key: string | number]: any }; // select
}