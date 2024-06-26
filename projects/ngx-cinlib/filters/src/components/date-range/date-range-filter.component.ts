import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Maybe, Period } from 'ngx-cinlib/core';
import { Subject, takeUntil } from 'rxjs';
import { FilterService } from '../../services/filter.service';

@Component({
  selector: 'cin-date-range-filter',
  templateUrl: './date-range-filter.component.html',
  styleUrls: ['./date-range-filter.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
  ]
})
export class DateRangeFilterComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  public disabled?: Maybe<boolean>;

  @Input()
  public initValue?: Period;

  @Input()
  public queryParamStartKey = 'end';

  @Input()
  public queryParamEndKey = 'start';

  @Output()
  public valueChanged = new EventEmitter<Period>();

  public form = this.fb.group({
    startDate: [undefined as Maybe<Date> | undefined],
    endDate: [undefined as Maybe<Date> | undefined],
  });

  // This is necessary due to the MatDateRange bug:
  // https://github.com/angular/components/issues/20218
  private emitEvent = true;

  private destroy = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private filterService: FilterService,
  ) {
    this.watchValueChange();
  }

  public ngOnInit(): void {
    if (this.initValue) {
      this.emitEvent = false;
      this.form.setValue({
        startDate: this.initValue.startDate,
        endDate: this.initValue.endDate
      });
    } else {
      this.filterService.queryParams()
        .pipe(takeUntil(this.destroy))
        .subscribe(params => {
          if (params?.[this.queryParamStartKey]
            && params?.[this.queryParamEndKey]) {
              this.form.setValue({
                startDate: new Date(params[this.queryParamStartKey] ?? ''),
                endDate: new Date(params[this.queryParamEndKey] ?? '')
              });
          } else {
            this.emitEvent = false;
            this.form.patchValue({
              startDate: undefined,
              endDate: undefined
            });
          }          
        });
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled']) {
      if (this.disabled) {
        this.emitEvent = false;
        this.form.controls.startDate.disable();
        this.form.controls.endDate.disable();
        if (this.queryParamStartKey || this.queryParamEndKey) {
          this.filterService.updateParam(this.queryParamStartKey, null);
          this.filterService.updateParam(this.queryParamEndKey, null);
        }
      } else {
        this.form.controls.startDate.enable();
        this.form.controls.endDate.enable();
      }
    }
  }

  private watchValueChange(): void {
    this.form.controls.endDate.valueChanges
      .pipe(takeUntil(this.destroy))
      .subscribe(endDate => {
        if (!isNaN(this.form.value?.startDate?.valueOf() || NaN)
          && !isNaN(endDate?.valueOf() || NaN)
          && this.emitEvent) {

          endDate?.setHours(23, 59, 59, 999);
          this.form.value.startDate?.setHours(0, 0 , 0, 0);

          this.valueChanged.emit({
            startDate: this.form.value.startDate,
            endDate,
          } as Period);
          this.filterService.updateParam(this.queryParamStartKey, this.form.value.startDate?.toISOString());
          this.filterService.updateParam(this.queryParamEndKey, endDate?.toISOString());
        }
        this.emitEvent = true;
      });
  }

  public ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }
  
}
