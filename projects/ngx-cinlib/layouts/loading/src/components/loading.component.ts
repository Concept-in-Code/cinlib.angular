import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable } from 'rxjs';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'cin-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule,
  ]
})
export class LoadingComponent implements OnInit {

  public loading?: Observable<boolean>;

  constructor(
    private loadingService: LoadingService,
  ) {}
  
  public ngOnInit(): void {
    // Timeout fixes ERROR Error: NG0100: ExpressionChangedAfterItHasBeenCheckedError
    // see: https://blog.angular-university.io/angular-debugging/
    setTimeout(() => this.loading = this.loadingService.isLoading());
  }

}