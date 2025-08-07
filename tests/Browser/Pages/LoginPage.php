<?php

class LoginPage
{
    protected $emailField = 'input[name="email"]';
    protected $passwordField = 'input[name="password"]';
    protected $loginButton = 'button[type="submit"]';

    public function fillEmail($email)
    {
        $this->fillField($this->emailField, $email);
    }

    public function fillPassword($password)
    {
        $this->fillField($this->passwordField, $password);
    }

    public function submit()
    {
        $this->click($this->loginButton);
    }

    public function loginAs($email, $password)
    {
        $this->fillEmail($email);
        $this->fillPassword($password);
        $this->submit();
    }

    public function assertIsOnLoginPage()
    {
        $this->assertSee('Login');
    }
}