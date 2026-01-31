
import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-view-message',
  templateUrl: './view-message.page.html',
  styleUrls: ['./view-message.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent],
})
export class ViewMessagePage {
}
    const isIos = this.platform.is('ios')
    return isIos ? 'Inbox' : '';
  }
}
