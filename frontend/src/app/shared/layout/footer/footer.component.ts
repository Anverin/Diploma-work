import {Component, ElementRef, TemplateRef, ViewChild} from '@angular/core';
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {FormBuilder, Validators} from "@angular/forms";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {HttpErrorResponse} from "@angular/common/http";
import {RequestService} from "../../services/request.service";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {

  @ViewChild('popupConsult') popupConsult!: TemplateRef<ElementRef>;
  dialogConsultRef: MatDialogRef<any> | null = null;

  @ViewChild('popupThanks') popupThanks!: TemplateRef<ElementRef>;
  dialogThanksRef: MatDialogRef<any> | null = null;

  errorNotice: boolean = false;

  consultForm = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/^([А-ЯЁ][а-яё]+\s*){1,}$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^((8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$/)]],
    type: ['consultation']
  });

  nameInput: string = '';
  phoneInput: string = '';

  get name() {
    return this.consultForm.get('name');
  }
  get phone() {
    return this.consultForm.get('phone');
  }

  constructor(private dialog: MatDialog,
              private _snackBar: MatSnackBar,
              private fb: FormBuilder,
              private requestService: RequestService) { }

  toCallBack() {
      this.dialogConsultRef = this.dialog.open(this.popupConsult);
  }

  requestConsult() {
    if (this.consultForm.valid && this.consultForm.value.name && this.consultForm.value.phone && this.consultForm.value.type) {
      this.requestService.sendRequest({
        name: this.consultForm.value.name,
        phone: '+7' + this.consultForm.value.phone,
        type: this.consultForm.value.type
      })
        .subscribe({
            next: (data: DefaultResponseType) => {
              if (data.error) {
                this._snackBar.open(data.message);
                this.errorNotice = true;
                throw new Error(data.message);
              }
              // если все хорошо - дива с ошибкой нет, закрывается и очищается форма, открывается ThanksPopup
              this.errorNotice = false;
              this.closeConsultPopup();
              this.dialogThanksRef = this.dialog.open(this.popupThanks);
            },
            error: (errorResponse: HttpErrorResponse) => {
              if (errorResponse.error && errorResponse.error.message) {
                this._snackBar.open(errorResponse.error.message);
                this.errorNotice = true;
              } else {
                this._snackBar.open('Ошибка сохранения');
                this.errorNotice = true;
              }
            }
          }
        );
    }


  }

  closeConsultPopup() {
    this.consultForm.markAsPristine();   //чтобы можно было повторно отправить форму с новыми или теми же данными (разблокировать кнопку)
    this.consultForm.markAsUntouched();   //чтобы сбросить валидацию (красные рамки) полей
                                           // (если использовать что-то одно - markAsPristine() или markAsUntouched() - кнопка разблокируется, но рамки не сбросятся)
    this.dialogConsultRef?.close();

    // форма очищается автоматически после отправки запроса, т.к. заданы  this.nameInput = ''; и this.phoneInput = '';
    // нужно ли очищать форму?
  }


  closeThanksPopup() {
    this.dialogThanksRef?.close();
  }

}
