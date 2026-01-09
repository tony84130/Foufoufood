import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  isLoading = false;
  returnUrl: string | null = null;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || null;
  }

  onSubmit(): void {
    this.submitted = true;
    
    // Marquer tous les champs comme touchés pour afficher les erreurs
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });

    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const { email, password } = this.loginForm.value;

    this.authService.signIn({ email, password }).subscribe({
      next: () => {
        const user = this.authService.getCurrentUser();
        if (user) {
          // Rediriger selon le rôle
          if (this.returnUrl) {
            this.router.navigateByUrl(this.returnUrl);
          } else {
            this.redirectByRole(user.role);
          }
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login error details:', error);
        
        // Afficher un message d'erreur plus détaillé
        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error.status === 401) {
          this.errorMessage = 'Email ou mot de passe incorrect';
        } else if (error.status === 0) {
          this.errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le serveur backend est démarré.';
        } else {
          this.errorMessage = `Erreur lors de la connexion: ${error.statusText || 'Erreur inconnue'}`;
        }
      }
    });
  }

  private redirectByRole(role: string): void {
    // Rediriger vers la page d'accueil après connexion
    this.router.navigate(['/']);
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}

