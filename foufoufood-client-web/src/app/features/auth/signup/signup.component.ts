import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  signupForm: FormGroup;
  errorMessage: string | null = null;
  isLoading = false;
  submitted = false;
  roleFromQuery: string | null = null;
  isRoleLocked = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Récupérer le rôle depuis les query params
    this.roleFromQuery = this.route.snapshot.queryParams['role'];
    const defaultRole = this.roleFromQuery === 'delivery_partner' ? 'delivery_partner' : 'client';
    
    // Si un rôle est passé en paramètre, on le verrouille
    this.isRoleLocked = !!this.roleFromQuery;

    this.signupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: [defaultRole, [Validators.required]],
      phone: [''],
      address: this.fb.group({
        line1: [''],
        line2: [''],
        city: [''],
        region: [''],
        postalCode: [''],
        country: ['']
      })
    }, { validators: this.passwordMatchValidator });

    // Si le rôle est verrouillé, désactiver le champ
    if (this.isRoleLocked) {
      this.signupForm.get('role')?.disable();
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onSubmit(): void {
    this.submitted = true;
    
    // Marquer tous les champs comme touchés pour afficher les erreurs
    Object.keys(this.signupForm.controls).forEach(key => {
      const control = this.signupForm.get(key);
      if (control) {
        control.markAsTouched();
        // Si c'est un FormGroup (comme address), marquer aussi ses champs
        if (control instanceof FormGroup) {
          Object.keys(control.controls).forEach(nestedKey => {
            control.get(nestedKey)?.markAsTouched();
          });
        }
      }
    });

    if (this.signupForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    // Récupérer la valeur du formulaire, y compris les champs désactivés
    const formValue = this.signupForm.getRawValue();
    const { confirmPassword, ...signupData } = formValue;

    // Nettoyer les champs vides de l'adresse
    if (signupData.address) {
      const address = Object.fromEntries(
        Object.entries(signupData.address).filter(([_, v]) => v !== '')
      );
      signupData.address = Object.keys(address).length > 0 ? address : undefined;
    }

    // Supprimer les champs vides
    if (!signupData.phone) {
      delete signupData.phone;
    }

    this.authService.signUp(signupData).subscribe({
      next: () => {
        const user = this.authService.getCurrentUser();
        if (user) {
          this.redirectByRole(user.role);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Erreur lors de l\'inscription';
      }
    });
  }

  private redirectByRole(role: string): void {
    switch (role) {
      case 'platform_admin':
        this.router.navigate(['/admin']);
        break;
      case 'restaurant_admin':
        this.router.navigate(['/restaurant-admin']);
        break;
      case 'delivery_partner':
        this.router.navigate(['/profile']);
        break;
      case 'client':
        this.router.navigate(['/restaurants']);
        break;
      default:
        this.router.navigate(['/restaurants']);
    }
  }

  get name() {
    return this.signupForm.get('name');
  }

  get email() {
    return this.signupForm.get('email');
  }

  get password() {
    return this.signupForm.get('password');
  }

  get confirmPassword() {
    return this.signupForm.get('confirmPassword');
  }

  get role() {
    return this.signupForm.get('role');
  }
}

