import { Injectable, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Maybe, PageableList } from 'ngx-cinlib/core';
import { setFieldValue } from 'ngx-cinlib/utils';
import { BehaviorSubject, Observable, combineLatest, map, take } from 'rxjs';
import { Column } from '../typings/column';
import { RowAction, RowCustomAction } from '../typings/row-action';
import { SortPaginate } from '../typings/sort-paginate';

@Injectable()
export class TableService {

  private actions = new BehaviorSubject<Maybe<RowAction<any>[]>>(null);

  private observed = new BehaviorSubject<boolean>(false);

  private columns = new BehaviorSubject<Maybe<Column<any>[]>>(null);

  private data = new BehaviorSubject<Maybe<PageableList<any>>>(null);

  private detailsComponent = new BehaviorSubject<Maybe<TemplateRef<any>>>(null);

  private inlineEditAction = new BehaviorSubject<Maybe<RowCustomAction<any>>>(null);
  private inlineEditActive = new BehaviorSubject<boolean>(false);
  private inlineEditRow = new BehaviorSubject<any>(null);
  
  private useQueryParams = new BehaviorSubject<boolean>(true);
  private params = new BehaviorSubject<SortPaginate>({
    page: 0,
    size: 10,
  });

  private rowClicked = new BehaviorSubject<any>(undefined);

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) {
    this.activatedRoute.queryParams
      .pipe(take(1))
      .subscribe((params: SortPaginate) => this.setParams(params));
  }

  public getActions(): Observable<Maybe<RowAction<any>[]>> {
    return this.actions.asObservable();
  }

  public setActions(actions: Maybe<Maybe<RowAction<any>[]>>): void {
    let inlineEditAction: Maybe<RowCustomAction<any>> = undefined;
    this.actions.next(actions?.filter(action => {
      const isInlineEdit = typeof action !== 'string'
        && Object.hasOwn(action, 'inlineEdit')
        && !!(action as RowCustomAction<any>).inlineEdit
  
      if (isInlineEdit) {
        inlineEditAction = action as RowCustomAction<any>;
      }
  
      return !isInlineEdit;
    }));
    this.setInlineEditAction(inlineEditAction);
  }

  public getColumns(): Observable<Maybe<Column<any>[]>> {
    return this.columns.asObservable();
  }

  public getDisplayColumns(): Observable<string[]> {
    return combineLatest([
      this.getColumns(),
      this.getActions(),
    ])
      .pipe(
        map(([columns, actions]) => [ 
          ...columns?.map(c => c.field) || [],
          ...(actions ? ['actions'] : [])
        ])
      );
  }

  public setColumns(columns: Maybe<Column<any>[]>): void {
    this.columns.next(columns);
  }

  public getData(): Observable<Maybe<PageableList<any>>> {
    return this.data.asObservable();
  }

  public setData(data: Maybe<PageableList<any>>): void {
    this.data.next(data);
  }

  public setDetailsComponent(component: any): void {
    this.detailsComponent.next(component);
  }

  public getDetailsComponent(): Observable<Maybe<TemplateRef<any>>> {
    return this.detailsComponent.asObservable();
  }

  public getInlineEditAction(): Observable<Maybe<RowCustomAction<any>>> {
    return this.inlineEditAction.asObservable();
  }

  public setInlineEditAction(action: Maybe<RowCustomAction<any>>): void {
    this.inlineEditAction.next(action);
  }

  public getInlineEditActive(): Observable<boolean> {
    return this.inlineEditActive.asObservable();
  }

  public setObserved(observed: boolean): void {
    this.observed.next(observed);
  }

  public getObserved(): Observable<boolean> {
    return this.observed.asObservable();
  }

  public getClickable(): Observable<boolean> {
    return combineLatest([
      this.getObserved(),
      this.getDetailsComponent()
    ]).pipe(
      map(([observed, detailsComponent]) => observed || !!detailsComponent)
    );
  }

  public enableInlineEdit(row: any): void {
    this.setInlineEditRow(row);
    this.inlineEditActive.next(true);
  }

  public getInlineEditRow(): Observable<any> {
    return this.inlineEditRow.asObservable();
  }

  public setInlineEditRow(row: any): void {
    this.inlineEditRow.next(row);
  }

  public editRow(field: string, value: any) {
    this.inlineEditRow.next(setFieldValue(this.inlineEditRow.value, field, value));
  }

  public rowEdited(): void {
    this.inlineEditAction.value?.callback?.(
      this.inlineEditRow.value
    );

    this.cancelInlineEdit();
  }

  public cancelInlineEdit(): void {
    this.inlineEditActive.next(false);
  }

  public setUseQueryParams(useQueryParams: boolean) {
    this.useQueryParams.next(useQueryParams);
  }

  public getParams(): Observable<SortPaginate> {
    return this.params.asObservable();
  }

  public setParams(params: SortPaginate): void {
    const newParams = {
      dir: params.dir,
      page: Number(params.page ?? this.params.value.page),
      size: Number(params.size ?? this.params.value.size),
      sort: params.sort
    };
    this.params.next(newParams);

    if (this.useQueryParams.value) {
      this.router.navigate([], {
        queryParams: newParams,
        queryParamsHandling: 'merge',
      })
    }
  }

  public getRowClicked(): Observable<any> {
    return this.rowClicked.asObservable();
  }

  public setRowClicked(rowClicked: any): void {
    this.rowClicked.next(rowClicked);
  }

}
